<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Read-only diagnostics behind /question-inspector. Works on a batch of
 * questions so the single view and the batch view share one code path and
 * the whole batch costs a fixed number of queries.
 *
 * Each check has a level: pass, warn (looks wrong but still served) or
 * fail (breaks practice or the answer key).
 */
class QuestionInspection
{
    public const SESSION_LIMIT = 5;

    private const BALANCED_TAGS = ['p', 'div', 'span', 'table', 'tr', 'td', 'ul', 'ol', 'li', 'b', 'strong', 'i', 'em', 'u'];

    /** @return array<int, array> keyed by question id */
    public static function inspectMany(Collection $questions): array
    {
        if ($questions->isEmpty()) {
            return [];
        }

        $ids = $questions->pluck('id')->all();
        $answers = DB::table('answers')->whereIn('question_id', $ids)->orderBy('seq')->orderBy('id')->get()->groupBy('question_id');
        $topicIds = $questions->pluck('topic_id')->filter()->unique()->values()->all();
        $topics = DB::table('topics')->whereIn('id', $topicIds)->get()->keyBy('id');
        $parentTopics = DB::table('topics')->whereIn('id', $topics->pluck('parent_id')->filter()->unique()->all())->get()->keyBy('id');
        $childTopics = DB::table('topics')->whereIn('parent_id', $topicIds)->get(['id', 'name', 'is_active', 'is_published', 'parent_id'])->groupBy('parent_id');
        $subjects = DB::table('subject')->whereIn('id', $topics->pluck('subject_id')->filter()->unique()->all())->get()->keyBy('id');
        $levels = DB::table('level')->whereIn('id', $topics->pluck('level_id')->filter()->unique()->all())->get()->keyBy('id');
        $existingParents = DB::table('questions')->whereIn('id', $questions->pluck('parent_id')->filter()->unique()->all())->pluck('id')->flip();
        $isPassage = DB::table('questions')->whereIn('parent_id', $ids)->distinct()->pluck('parent_id')->flip();

        $types = $questions->mapWithKeys(fn ($q) => [
            $q->id => PracticeQuestionTypes::practiceTypeForAnswerCount(($answers[$q->id] ?? collect())->count()),
        ]);
        $inPool = [];
        $eligible = [];
        foreach ([PracticeQuestionTypes::OBJECTIVE, PracticeQuestionTypes::SUBJECTIVE] as $type) {
            $typeIds = $types->filter(fn ($t) => $t === $type)->keys()->all();
            if (! $typeIds) {
                continue;
            }
            foreach (PracticeQuestionTypes::applyPracticePool(DB::table('questions'), $type)->whereIn('questions.id', $typeIds)->pluck('questions.id') as $id) {
                $inPool[$id] = true;
            }
            $eligible[$type] = PracticeQuestionTypes::applyPracticePool(DB::table('questions'), $type)
                ->whereIn('questions.topic_id', $topicIds)
                ->where('questions.is_active', 1)->where('questions.is_published', 1)->where('questions.approval_status', 1)
                ->select('questions.topic_id')->selectRaw('count(*) as c')->groupBy('questions.topic_id')
                ->pluck('c', 'topic_id');
        }

        $results = [];
        foreach ($questions as $question) {
            $qAnswers = $answers[$question->id] ?? collect();
            $topic = $topics[$question->topic_id] ?? null;
            $parentTopic = $topic && $topic->parent_id ? ($parentTopics[$topic->parent_id] ?? null) : null;
            $children = $topic ? ($childTopics[$topic->id] ?? collect()) : collect();
            $type = $types[$question->id];

            $context = compact('question', 'qAnswers', 'topic', 'parentTopic', 'children', 'type') + [
                'subject' => $topic ? ($subjects[$topic->subject_id] ?? null) : null,
                'level' => $topic ? ($levels[$topic->level_id] ?? null) : null,
                'inPool' => isset($inPool[$question->id]),
                'isPassage' => isset($isPassage[$question->id]),
                'parentMissing' => (int) $question->parent_id > 0 && ! isset($existingParents[$question->parent_id]),
                'eligibleInTopic' => (int) ($eligible[$type][$question->topic_id] ?? 0),
            ];

            $results[$question->id] = self::evaluate($context) + [
                'answers' => $qAnswers, 'topic' => $topic, 'parent_topic' => $parentTopic,
                'child_topics' => $children, 'subject' => $context['subject'], 'level' => $context['level'],
                'practice_type' => $type,
            ];
        }

        return $results;
    }

    private static function evaluate(array $c): array
    {
        /** @var object $q */
        $q = $c['question'];
        $answers = $c['qAnswers'];
        $topic = $c['topic'];
        $objective = $c['type'] === PracticeQuestionTypes::OBJECTIVE;
        $answerCount = $answers->count();
        $activeCount = $answers->where('isactive', 1)->count();
        $checks = [];
        $add = function (string $key, string $label, string $level, string $info) use (&$checks) {
            $checks[] = compact('key', 'label', 'level', 'info');
        };

        $add('exists', 'Rekod soalan wujud', 'pass', "ID {$q->id} · {$q->question_code}");
        $add('active', 'Soalan aktif', (int) $q->is_active === 1 ? 'pass' : 'fail', (int) $q->is_active === 1 ? 'is_active = 1' : "is_active = {$q->is_active}. Aktifkan soalan ini.");
        $add('published', 'Soalan diterbitkan', (int) $q->is_published === 1 ? 'pass' : 'fail', (int) $q->is_published === 1 ? 'is_published = 1' : "is_published = {$q->is_published}. Terbitkan soalan ini.");
        $add('approved', 'Soalan diluluskan', (int) $q->approval_status === 1 ? 'pass' : 'fail', (int) $q->approval_status === 1 ? 'approval_status = 1' : "approval_status = {$q->approval_status}. Perlu 1 (diluluskan).");

        $hasText = QuestionContentNormalizer::hasContent($q->question_text);
        $hasFile = trim((string) $q->question_file) !== '';
        $emptyLevel = (int) $q->parent_id > 0 ? 'warn' : 'fail';
        $add('content', 'Ada kandungan soalan', $hasText || $hasFile ? 'pass' : $emptyLevel,
            $hasText && $hasFile ? 'Ada teks dan fail gambar.' : ($hasText ? 'Ada teks soalan.' : ($hasFile ? 'Gambar sahaja, tiada teks.' : 'Teks dan fail soalan kedua-duanya kosong.')));

        if ($hasFile && QuestionContentNormalizer::imageFileUrl($q->question_file, 'questions') === null) {
            $add('question_file', 'Fail soalan ialah imej', 'warn', "question_file \"{$q->question_file}\" bukan rujukan imej (jpg/png/gif/webp/svg).");
        }

        $bankType = (int) $q->question_type_id;
        if ($bankType === 1 && $answerCount < 2) {
            $add('type', 'Jenis soalan padan jawapan', 'fail', "Jenis bank MCQ tetapi hanya ada {$answerCount} jawapan. Dikecualikan daripada latihan.");
        } elseif (in_array($bankType, [3, 4], true) && $answerCount >= 2) {
            $add('type', 'Jenis soalan padan jawapan', 'warn', "Jenis bank Essay tetapi ada {$answerCount} jawapan; dilatih sebagai Objektif.");
        } else {
            $add('type', 'Jenis soalan padan jawapan', 'pass', 'Jenis bank ' . $bankType . ' · dilatih sebagai ' . ($objective ? 'Objektif' : 'Subjektif') . '.');
        }

        if ($objective) {
            $add('answers', 'Bilangan jawapan', 'pass', "{$answerCount} jawapan · {$activeCount} aktif");
            $correct = $answers->filter(fn ($a) => (int) ($a->iscorrectanswer ?? 0) === 1);
            $add('correct', 'Jawapan betul ditanda', match (true) {
                $correct->isEmpty() => 'fail',
                $correct->count() > 1 => 'warn',
                default => 'pass',
            }, match (true) {
                $correct->isEmpty() => 'Tiada jawapan ditanda betul (iscorrectanswer).',
                $correct->count() > 1 => "{$correct->count()} jawapan ditanda betul; objektif biasa hanya 1.",
                default => 'Jawapan betul: ' . chr(65 + $answers->values()->search(fn ($a) => (int) $a->iscorrectanswer === 1)) . '.',
            });
            $inactiveCorrect = $correct->filter(fn ($a) => (int) $a->isactive !== 1);
            $inactive = $answerCount - $activeCount;
            // Practice does not filter on answers.isactive, so this only flags inconsistent data.
            $add('inactive_answers', 'Jawapan aktif', $inactive > 0 ? 'warn' : 'pass',
                $inactiveCorrect->isNotEmpty() ? 'Jawapan betul (ID ' . $inactiveCorrect->pluck('id')->implode(', ') . ') tidak aktif.' : ($inactive > 0 ? "{$inactive} jawapan tidak aktif." : 'Semua jawapan aktif.'));

            $blank = $answers->filter(fn ($a) => ! QuestionContentNormalizer::hasContent($a->answer_text) && trim((string) ($a->answer_option_file ?? '')) === '');
            $add('answer_content', 'Setiap pilihan ada isi', $blank->isEmpty() ? 'pass' : 'warn',
                $blank->isEmpty() ? 'Semua pilihan ada teks atau gambar.' : "{$blank->count()} pilihan kosong (jawapan ID " . $blank->pluck('id')->implode(', ') . ').');

            $texts = $answers->map(fn ($a) => mb_strtolower(trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags((string) $a->answer_text))))))
                ->filter(fn ($t) => $t !== '');
            $dupes = $texts->duplicates()->unique();
            $add('duplicates', 'Pilihan tidak berulang', $dupes->isEmpty() ? 'pass' : 'warn',
                $dupes->isEmpty() ? 'Tiada pilihan yang sama.' : 'Teks berulang: ' . $dupes->take(3)->implode(' | '));
        } else {
            $hasSchema = $answers->contains(fn ($a) => QuestionContentNormalizer::hasContent($a->sample_answer ?? null)
                || QuestionContentNormalizer::hasContent($a->reason ?? null)
                || QuestionContentNormalizer::hasContent($a->reason2 ?? null)
                || QuestionContentNormalizer::hasContent($a->answer_text ?? null));
            $add('answers', 'Skema jawapan ada', $hasSchema ? 'pass' : 'warn',
                $hasSchema ? "{$answerCount} rekod jawapan, ada skema/contoh jawapan." : 'Tiada rekod jawapan atau skema kosong.');
        }

        if ((int) $q->parent_id > 0) {
            $add('passage', 'Passage induk wujud', $c['parentMissing'] ? 'fail' : 'pass',
                $c['parentMissing'] ? "parent_id {$q->parent_id} tiada dalam jadual soalan." : "Passage induk ID {$q->parent_id}.");
        }

        $subjectLevelOk = $topic && $c['subject'] && $c['level'];
        $add('topic_exists', 'Topik, subjek dan tahap wujud', $subjectLevelOk ? 'pass' : 'fail',
            ! $topic ? "topic_id {$q->topic_id} tiada." : (! $c['subject'] ? "subject_id {$topic->subject_id} tiada." : (! $c['level'] ? "level_id {$topic->level_id} tiada." : "{$c['subject']->name} › {$c['level']->name} › {$topic->name} (ID {$topic->id})")));

        $topicVisible = $topic && (int) $topic->is_active === 1 && (int) $topic->is_published === 1;
        $add('topic_visible', 'Topik aktif dan diterbitkan', $topicVisible ? 'pass' : 'fail',
            ! $topic ? 'Tiada topik.' : ($topicVisible ? 'is_active = 1 · is_published = 1' : "is_active = {$topic->is_active} · is_published = {$topic->is_published}."));

        $parent = $c['parentTopic'];
        $parentVisible = ! $parent || ((int) $parent->is_active === 1 && (int) $parent->is_published === 1);
        $tile = $topicVisible && $parentVisible && $c['children']->isEmpty();
        $add('tile', 'Topik ada kad latihan', $tile ? 'pass' : 'fail', match (true) {
            ! $topic => 'Tiada topik.',
            $c['children']->isNotEmpty() => "Topik ada {$c['children']->count()} subtopik; halaman kursus memaparkan subtopik, bukan topik ini.",
            ! $parentVisible => "Topik induk \"{$parent->name}\" tidak aktif/diterbitkan.",
            ! $topicVisible => 'Topik tidak kelihatan.',
            default => $parent ? "Subtopik di bawah \"{$parent->name}\"." : 'Topik paling bawah dalam struktur kursus.',
        });

        $poolInfo = match (true) {
            $c['inPool'] => 'Jenis ' . ($objective ? 'Objektif' : 'Subjektif') . " ({$answerCount} jawapan).",
            ! in_array($bankType, [1, 2, 3, 4], true) => "question_type_id {$bankType} bukan jenis yang dilatih (1-4).",
            $c['isPassage'] => 'Soalan ini ialah passage induk; hanya anak soalannya dilatih.',
            default => 'Tidak memenuhi syarat kumpulan ' . ($objective ? 'Objektif (2+ jawapan).' : 'Subjektif (bukan MCQ, kurang 2 jawapan).'),
        };
        $add('pool', 'Termasuk dalam kumpulan latihan', $c['inPool'] ? 'pass' : 'fail', $poolInfo);

        $eligible = $c['eligibleInTopic'];
        $add('eligible', 'Cukup soalan dalam topik', $eligible >= self::SESSION_LIMIT ? 'pass' : 'warn',
            "{$eligible} soalan " . ($objective ? 'Objektif' : 'Subjektif') . ' layak dalam topik ini' . ($eligible >= self::SESSION_LIMIT ? '.' : '; kurang daripada ' . self::SESSION_LIMIT . ' soalan setiap sesi.'));

        $html = $q->question_text . ' ' . $answers->pluck('answer_text')->implode(' ');
        $htmlIssues = self::htmlIssues($html);
        $add('html', 'HTML bersih', $htmlIssues ? 'warn' : 'pass', $htmlIssues ? implode('; ', $htmlIssues) : 'Tiada tag tidak seimbang atau sisa Word.');

        $available = $c['inPool'] && (int) $q->is_active === 1 && (int) $q->is_published === 1 && (int) $q->approval_status === 1 && $tile;
        $levels = array_column($checks, 'level');
        $overall = in_array('fail', $levels, true) ? 'fail' : (in_array('warn', $levels, true) ? 'warn' : 'pass');

        return [
            'checks' => $checks,
            'verdict' => [
                'level' => $overall,
                'available' => $available,
                'headline' => match (true) {
                    ! $available => 'TIDAK LAYAK muncul dalam latihan',
                    $overall === 'fail' => 'Muncul dalam latihan, tetapi data bermasalah',
                    $overall === 'warn' => 'LAYAK, ada amaran',
                    default => 'LAYAK muncul dalam latihan',
                },
                'issues' => collect($checks)->where('level', '!=', 'pass')->values()->all(),
            ],
            'diagnostics' => [
                'exists' => true,
                'answer_count' => $answerCount,
                'active_answer_count' => $activeCount,
                'practice_type' => $objective ? 'Objektif' : 'Subjektif',
                'in_practice_pool' => $c['inPool'],
                'question_active' => (int) $q->is_active === 1,
                'question_published' => (int) $q->is_published === 1,
                'question_approved' => (int) $q->approval_status === 1,
                'topic_visible' => (bool) $topicVisible,
                'topic_has_children' => $c['children']->isNotEmpty(),
                'practice_tile_visible' => (bool) $tile,
                'available_for_practice' => $available,
                'session_limit' => self::SESSION_LIMIT,
            ],
        ];
    }

    /** Image URLs a browser can test-load: question, option and inline images. */
    public static function imagesFor(object $question, Collection $answers): array
    {
        $found = [];
        $collect = function (string $where, ?string $html) use (&$found) {
            if ($html && preg_match_all('/<img\b[^>]*\bsrc=["\']([^"\']+)["\']/i', $html, $m)) {
                foreach ($m[1] as $src) {
                    $found[$src] ??= $where;
                }
            }
        };

        $collect('Soalan', QuestionContentNormalizer::questionHtml($question->question_text, $question->question_file));
        foreach ($answers->values() as $i => $answer) {
            $label = 'Pilihan ' . chr(65 + $i % 26);
            if ($file = QuestionContentNormalizer::answerFileUrl($answer->answer_option_file ?? null)) {
                $found[$file] ??= $label;
            }
            $collect($label, QuestionContentNormalizer::normalizeHtml($answer->answer_text));
        }

        return collect($found)->map(fn ($where, $url) => ['where' => $where, 'url' => $url])->values()->take(40)->all();
    }

    private static function htmlIssues(string $html): array
    {
        $issues = [];
        foreach (self::BALANCED_TAGS as $tag) {
            $open = preg_match_all('/<' . $tag . '(?=[\s>\/])/i', $html);
            $close = preg_match_all('/<\/' . $tag . '\s*>/i', $html);
            if ($open !== $close) {
                $issues[] = "<{$tag}> dibuka {$open}× ditutup {$close}×";
            }
        }
        if (preg_match('/class=["\']?Mso|<o:p|mso-[a-z-]+:/i', $html)) {
            $issues[] = 'Ada sisa format Microsoft Word (Mso)';
        }

        return array_slice($issues, 0, 4);
    }
}
