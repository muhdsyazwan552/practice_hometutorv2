<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Support\PracticeQuestionTypes;
use App\Support\QuestionContentNormalizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuestionInspectorController extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()?->email === 'tasya@children.hometutor.local', 403);

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
            $answers = DB::table('answers')->where('question_id', $question->id)->orderBy('seq')->orderBy('id')->get();
            $topic = DB::table('topics')->where('id', $question->topic_id)->first();
            $parentTopic = $topic && $topic->parent_id
                ? DB::table('topics')->where('id', $topic->parent_id)->first()
                : null;
            $childTopics = $topic
                ? DB::table('topics')->where('parent_id', $topic->id)->get(['id', 'name', 'is_active', 'is_published'])
                : collect();
            $subject = $topic ? DB::table('subject')->where('id', $topic->subject_id)->first() : null;
            $level = $topic ? DB::table('level')->where('id', $topic->level_id)->first() : null;
            $answerCount = $answers->count();
            $practiceType = PracticeQuestionTypes::practiceTypeForAnswerCount($answerCount);
            $passages = PracticeQuestionTypes::passagesFor([$question]);
            $poolQuery = PracticeQuestionTypes::applyPracticePool(
                DB::table('questions'), $practiceType
            );
            $inPracticePool = $poolQuery->where('questions.id', $question->id)->exists();
            $isVisibleTopic = $topic
                && (int) $topic->is_active === 1
                && (int) $topic->is_published === 1;
            $isChildOfVisibleParent = ! $parentTopic
                || ((int) $parentTopic->is_active === 1 && (int) $parentTopic->is_published === 1);
            $isPracticeTile = $isVisibleTopic && $isChildOfVisibleParent && $childTopics->isEmpty();

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
                'topic' => $topic ? (array) $topic : null,
                'parent_topic' => $parentTopic ? (array) $parentTopic : null,
                'child_topics' => $childTopics->map(fn ($child) => (array) $child)->all(),
                'subject' => $subject ? (array) $subject : null,
                'level' => $level ? (array) $level : null,
                'diagnostics' => [
                    'exists' => true,
                    'answer_count' => $answerCount,
                    'active_answer_count' => $answers->where('isactive', 1)->count(),
                    'practice_type' => $practiceType === PracticeQuestionTypes::OBJECTIVE ? 'Objektif' : 'Subjektif',
                    'in_practice_pool' => $inPracticePool,
                    'question_active' => (int) $question->is_active === 1,
                    'question_published' => (int) $question->is_published === 1,
                    'topic_visible' => (bool) $isVisibleTopic,
                    'topic_has_children' => $childTopics->isNotEmpty(),
                    'practice_tile_visible' => (bool) $isPracticeTile,
                    'available_for_practice' => $inPracticePool
                        && (int) $question->is_active === 1
                        && (int) $question->is_published === 1
                        && $isPracticeTile,
                    'session_limit' => 5,
                ],
            ];
        }

        return Inertia::render('QuestionInspector', [
            'search' => $search,
            'details' => $details,
        ]);
    }
}
