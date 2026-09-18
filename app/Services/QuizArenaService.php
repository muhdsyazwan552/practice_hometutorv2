<?php

namespace App\Services;

use App\Models\QuizArenaSession;
use App\Models\Topic;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class QuizArenaService
{
    public const TIMEZONE = 'Asia/Kuala_Lumpur';

    private const POINTS_BY_RANK = [1 => 50, 2 => 30, 3 => 20];

    private const PARTICIPATION_POINTS = 5;

    public function __construct(private readonly QuizArenaWalletService $wallet) {}

    public function now(): CarbonImmutable
    {
        return CarbonImmutable::now(self::TIMEZONE);
    }

    public function isOpen(): bool
    {
        return $this->now()->isWeekend();
    }

    /**
     * The Saturday date of the weekend this moment belongs to (if it's
     * currently the weekend) or the upcoming one (if it's a weekday).
     */
    public function currentWeekendDate(): CarbonImmutable
    {
        $now = $this->now();

        if ($now->isWeekend()) {
            return $now->isSaturday() ? $now->startOfDay() : $now->subDay()->startOfDay();
        }

        return $now->next(CarbonImmutable::SATURDAY)->startOfDay();
    }

    public function opensAt(): CarbonImmutable
    {
        return $this->currentWeekendDate()->startOfDay();
    }

    public function closesAt(): CarbonImmutable
    {
        return $this->opensAt()->addDay()->endOfDay();
    }

    /**
     * Random objective questions spanning every subject/topic at the given
     * level — deliberately simple (no mastery weighting, no single-subject
     * scoping) since the arena is meant to be a plain random mix.
     */
    public function generateQuestions(int $levelId, int $count = 10): array
    {
        $topicIds = Topic::query()
            ->where('level_id', $levelId)
            ->where('is_active', 1)
            ->pluck('id');

        return DB::table('questions')
            ->whereIn('topic_id', $topicIds)
            ->where('question_type_id', 1)
            ->where('is_active', 1)
            ->where('is_published', 1)
            ->inRandomOrder()
            ->limit($count)
            ->pluck('id')
            ->all();
    }

    /**
     * Rank every completed session for the given weekend, grouped by level,
     * and assign points. Safe to re-run (idempotent — always recomputes).
     */
    public function settleWeekend(CarbonImmutable $weekendDate): void
    {
        $sessionsByLevel = QuizArenaSession::query()
            ->where('weekend_date', $weekendDate->toDateString())
            ->where('status', QuizArenaSession::STATUS_COMPLETED)
            ->get()
            ->groupBy('level_id');

        foreach ($sessionsByLevel as $sessions) {
            $ranked = $sessions
                ->sortBy([
                    ['correct_answers', 'desc'],
                    ['total_time_seconds', 'asc'],
                ])
                ->values();

            foreach ($ranked as $index => $session) {
                $rank = $index + 1;
                $points = self::POINTS_BY_RANK[$rank] ?? self::PARTICIPATION_POINTS;

                $session->update(['rank' => $rank, 'points_awarded' => $points]);

                $this->wallet->grant(
                    userId: $session->user_id,
                    points: $points,
                    type: 'quiz_arena_weekend',
                    description: $rank <= 3
                        ? "Quiz Arena minggu {$weekendDate->toDateString()} \u{2014} tempat #{$rank}"
                        : "Quiz Arena minggu {$weekendDate->toDateString()} \u{2014} penyertaan",
                    eventKey: "quiz_arena_weekend:{$weekendDate->toDateString()}:{$session->user_id}",
                    weekStart: $weekendDate,
                    referenceType: 'quiz_arena_session',
                    referenceId: $session->id,
                );
            }
        }
    }
}
