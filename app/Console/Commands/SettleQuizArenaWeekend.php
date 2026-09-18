<?php

namespace App\Console\Commands;

use App\Services\QuizArenaService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

class SettleQuizArenaWeekend extends Command
{
    /**
     * Defaults to the most recently completed weekend, so it's safe to run
     * any time after that weekend closes. Pass --date=YYYY-MM-DD (any day
     * within the target weekend) to settle a specific one, e.g. for testing.
     */
    protected $signature = 'quiz-arena:settle {--date= : Any date within the weekend to settle (defaults to the last completed weekend)}';

    protected $description = 'Rank completed Quiz Arena sessions for a weekend and award points.';

    public function handle(QuizArenaService $arena): int
    {
        $reference = $this->option('date')
            ? CarbonImmutable::parse($this->option('date'), QuizArenaService::TIMEZONE)
            : $arena->now()->subDay();

        $weekendDate = $reference->isWeekend()
            ? ($reference->isSaturday() ? $reference->startOfDay() : $reference->subDay()->startOfDay())
            : $reference->previous(CarbonImmutable::SATURDAY)->startOfDay();

        $arena->settleWeekend($weekendDate);

        $this->info("Settled Quiz Arena weekend starting {$weekendDate->toDateString()}.");

        return self::SUCCESS;
    }
}
