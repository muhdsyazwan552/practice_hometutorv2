<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Support\PracticeQuestionTypes;
use App\Support\QuestionContentNormalizer;
use App\Support\QuestionInspection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuestionInspectorController extends Controller
{
    private const BATCH_LIMIT = 200;

    public function __invoke(Request $request)
    {
        $this->authorizeInspector($request);

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:80'],
        ]);
        $search = trim($validated['q'] ?? '');
        $question = null;

        if ($search !== '') {
            $query = DB::table('questions');
            $question = ctype_digit($search)
                ? $query->where('id', (int) $search)->orWhere('question_code', $search)->first()
                : $query->where('question_code', $search)->first();
        }

        $details = null;
        if ($question) {
            $inspection = QuestionInspection::inspectMany(collect([$question]))[$question->id];
            $answers = $inspection['answers'];
            $passages = PracticeQuestionTypes::passagesFor([$question]);

            $details = [
                'question' => (array) $question,
                'question_html' => QuestionContentNormalizer::questionHtml($question->question_text, $question->question_file),
                'answers' => $answers->map(fn ($answer) => (array) $answer)->all(),
                'preview' => [
                    'passage' => $passages[$question->parent_id ?? 0] ?? null,
                    'answers' => $answers->map(fn ($answer) => [
                        'id' => $answer->id,
                        'text' => QuestionContentNormalizer::normalizeHtml($answer->answer_text),
                        'file' => QuestionContentNormalizer::answerFileUrl($answer->answer_option_file ?? null),
                        'correct' => (int) ($answer->iscorrectanswer ?? 0) === 1,
                        'schema' => QuestionContentNormalizer::normalizeHtml(
                            ($answer->sample_answer ?? null)
                                ?: ($answer->reason ?? null)
                                ?: ($answer->reason2 ?? null)
                                ?: $answer->answer_text
                        ),
                    ])->all(),
                ],
                'topic' => $inspection['topic'] ? (array) $inspection['topic'] : null,
                'parent_topic' => $inspection['parent_topic'] ? (array) $inspection['parent_topic'] : null,
                'child_topics' => $inspection['child_topics']->map(fn ($child) => (array) $child)->all(),
                'subject' => $inspection['subject'] ? (array) $inspection['subject'] : null,
                'level' => $inspection['level'] ? (array) $inspection['level'] : null,
                'diagnostics' => $inspection['diagnostics'],
                'checks' => $inspection['checks'],
                'verdict' => $inspection['verdict'],
                'images' => QuestionInspection::imagesFor($question, $answers),
            ];
        }

        return Inertia::render('QuestionInspector', [
            'search' => $search,
            'details' => $details,
            'batch' => null,
        ]);
    }

    /** Check many IDs / codes at once; one row per input, in input order. */
    public function batch(Request $request)
    {
        $this->authorizeInspector($request);

        $validated = $request->validate([
            'codes' => ['required', 'string', 'max:20000'],
        ]);
        $tokens = collect(preg_split('/[\s,;]+/', $validated['codes'], -1, PREG_SPLIT_NO_EMPTY))->unique()->values();
        $truncated = $tokens->count() > self::BATCH_LIMIT;
        $tokens = $tokens->take(self::BATCH_LIMIT);

        $numeric = $tokens->filter(fn ($t) => ctype_digit($t))->map(fn ($t) => (int) $t)->all();
        $questions = DB::table('questions')
            ->whereIn('question_code', $tokens->all())
            ->orWhereIn('id', $numeric)
            ->get();
        $byId = $questions->keyBy('id');
        $byCode = $questions->keyBy('question_code');

        // Plain list of [token, question]: numeric tokens would become int array keys.
        $resolved = $tokens->map(fn ($token) => [
            (string) $token,
            (ctype_digit((string) $token) ? ($byId[(int) $token] ?? null) : null) ?? ($byCode[$token] ?? null),
        ]);
        $inspections = QuestionInspection::inspectMany($resolved->pluck(1)->filter()->unique('id')->values());

        $rows = $resolved->map(function ($pair) use ($inspections) {
            [$token, $question] = $pair;
            if (! $question) {
                return ['input' => $token, 'found' => false, 'id' => null, 'code' => null, 'topic' => null, 'level' => 'missing', 'available' => false, 'issues' => []];
            }
            $inspection = $inspections[$question->id];

            return [
                'input' => $token,
                'found' => true,
                'id' => $question->id,
                'code' => $question->question_code,
                'topic' => $inspection['topic']->name ?? null,
                'level' => $inspection['verdict']['level'],
                'available' => $inspection['verdict']['available'],
                'issues' => array_map(fn ($i) => ['level' => $i['level'], 'label' => $i['label'], 'info' => $i['info']], $inspection['verdict']['issues']),
            ];
        })->values()->all();

        return Inertia::render('QuestionInspector', [
            'search' => '',
            'details' => null,
            'batch' => ['input' => $validated['codes'], 'rows' => $rows, 'truncated' => $truncated, 'limit' => self::BATCH_LIMIT],
        ]);
    }

    private function authorizeInspector(Request $request): void
    {
        abort_unless($request->user()?->email === 'tasya@children.hometutor.local', 403);
    }
}
