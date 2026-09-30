<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\QuizArenaWalletService;
use Illuminate\Console\Command;

class GrantStarterBonus extends Command
{
    protected $signature = 'quiz-arena:grant-starter-bonus {--dry-run : Only show who would receive points}';

    protected $description = 'Give every existing child the Quiz Arena starter bonus (enough to claim one theme), or top it up to the current amount. Safe to run again.';

    public function handle(QuizArenaWalletService $wallet): int
    {
        $children = User::query()
            ->where('role_id', User::ROLE_CHILD)
            ->whereHas('student')
            ->orderBy('id')
            ->get(['id', 'name']);

        $dryRun = (bool) $this->option('dry-run');
        $granted = 0;
        $points = 0;

        foreach ($children as $child) {
            if ($dryRun) {
                $missing = max(0, QuizArenaWalletService::STARTER_BONUS_POINTS - $wallet->starterBonusReceived($child->id));
                if ($missing > 0) {
                    $granted++;
                    $points += $missing;
                    $this->line("Would give {$missing} points to #{$child->id}");
                }
                continue;
            }

            $added = $wallet->grantStarterBonus($child->id);
            if ($added > 0) {
                $granted++;
                $points += $added;
            }
        }

        $verb = $dryRun ? 'Would give' : 'Gave';
        $this->info("{$verb} {$points} points to {$granted} of {$children->count()} child account(s).");

        return self::SUCCESS;
    }
}
