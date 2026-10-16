<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Decides which questions are practised as Objective and which as Subjective.
 *
 * questions.question_type_id can't be trusted for this: the old bank used
 * 1 MCQ, 2 CMCQ, 3 ESSAY, 4 CESSAY, while the current upload tool saves
 * essays as 2. So the split goes by content instead:
 *   - 2+ answer rows (options to choose from)  -> Objective
 *   - 0-1 answer rows (a model answer)         -> Subjective
 * Type 1 (MCQ) without options is broken data and is left out of both.
 *
 * CMCQ/CESSAY are comprehension questions: a passage row (no answers) with
 * child questions pointing at it through parent_id. Passages are never
 * practised themselves; their text is shown above each child question.
 *
 * practice_session / quiz_attempts keep using 1 = Objective, 2 = Subjective.
 */
class PracticeQuestionTypes
{
    public const OBJECTIVE = 1;

    public const SUBJECTIVE = 2;

    /** Bank types that can be practised (5 is an old, unused type). */
    private const BANK_TYPES = [1, 2, 3, 4];

    private const MCQ = 1;

    /**
     * Limit a questions query to one practice type.
     * questions.parent_id and answers.question_id have no index, so both
     * lookups are uncorrelated subqueries MySQL runs once per query.
     */
    public static function applyPracticePool(Builder $query, int $practiceType, string $table = 'questions'): Builder
    {
        $query->whereIn("{$table}.question_type_id", self::BANK_TYPES)
            ->whereNotIn("{$table}.id", function ($parents) {
                $parents->select('parent_id')
                    ->from('questions')
                    ->where('parent_id', '>', 0);
            });

        if ($practiceType === self::SUBJECTIVE) {
            return $query->where("{$table}.question_type_id", '<>', self::MCQ)
                ->whereNotIn("{$table}.id", self::questionsWithOptions(...));
        }

        return $query->whereIn("{$table}.id", self::questionsWithOptions(...));
    }

    /** Practice type for a question, from how many answer rows it has. */
    public static function practiceTypeForAnswerCount(int $answerCount): int
    {
        return $answerCount >= 2 ? self::OBJECTIVE : self::SUBJECTIVE;
    }

    /** Normalized passage HTML for each comprehension parent, keyed by parent id. */
    public static function passagesFor(iterable $questions): array
    {
        $parentIds = collect($questions)
            ->map(fn ($question) => (int) (data_get($question, 'parent_id') ?? 0))
            ->filter()
            ->unique()
            ->values();

        if ($parentIds->isEmpty()) {
            return [];
        }

        return DB::table('questions')
            ->whereIn('id', $parentIds)
            ->get(['id', 'question_text', 'question_file'])
            ->mapWithKeys(fn ($parent) => [
                $parent->id => QuestionContentNormalizer::questionHtml($parent->question_text, $parent->question_file),
            ])
            ->all();
    }

    private static function questionsWithOptions(Builder $answers): void
    {
        $answers->select('question_id')
            ->from('answers')
            ->groupBy('question_id')
            ->havingRaw('count(*) >= 2');
    }
}
