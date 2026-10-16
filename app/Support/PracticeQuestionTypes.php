<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Maps the question bank types onto the two practice types students see.
 *
 * questions.question_type_id: 1 MCQ, 2 CMCQ, 3 ESSAY, 4 CESSAY.
 * CMCQ/CESSAY are comprehension questions: a passage row (no answers) with
 * child questions pointing at it through parent_id.
 *
 * practice_session / quiz_attempts keep using 1 = Objective, 2 = Subjective.
 */
class PracticeQuestionTypes
{
    public const OBJECTIVE = 1;

    public const SUBJECTIVE = 2;

    public const MCQ = 1;

    public const CMCQ = 2;

    public const ESSAY = 3;

    public const CESSAY = 4;

    /** Question bank types shown under a practice type. */
    public static function questionTypeIds(int $practiceType): array
    {
        return $practiceType === self::SUBJECTIVE
            ? [self::ESSAY, self::CESSAY]
            : [self::MCQ, self::CMCQ];
    }

    /** Practice type (Objective/Subjective) a question bank type belongs to. */
    public static function practiceTypeFor(int $questionTypeId): int
    {
        return in_array($questionTypeId, [self::ESSAY, self::CESSAY], true)
            ? self::SUBJECTIVE
            : self::OBJECTIVE;
    }

    /**
     * Limit a questions query to one practice type and drop the passage rows,
     * which only hold the comprehension text and have no answers.
     * questions.parent_id has no index, so the parent ids are collected in one
     * uncorrelated subquery instead of a NOT EXISTS per row.
     */
    public static function applyPracticePool(Builder $query, int $practiceType, string $table = 'questions'): Builder
    {
        return $query
            ->whereIn("{$table}.question_type_id", self::questionTypeIds($practiceType))
            ->whereNotIn("{$table}.id", function ($parents) {
                $parents->select('parent_id')
                    ->from('questions')
                    ->where('parent_id', '>', 0);
            });
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
}
