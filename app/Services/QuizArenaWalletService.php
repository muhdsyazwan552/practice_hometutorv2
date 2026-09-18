<?php

namespace App\Services;

use App\Models\DashboardTheme;
use App\Models\QuizArenaPointLog;
use App\Models\QuizArenaReward;
use App\Models\QuizArenaRewardClaim;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuizArenaWalletService
{
    public const STARTER_BONUS_POINTS = 300;

    public function balance(int $userId): int
    {
        return (int) QuizArenaPointLog::where('user_id', $userId)->sum('points');
    }

    public function log(int $userId, int $limit = 50)
    {
        return QuizArenaPointLog::where('user_id', $userId)->latest('id')->limit($limit)->get();
    }

    /**
     * Records a point event. Idempotent when $eventKey is given — a repeat
     * call with the same (user_id, event_key) is a silent no-op, relying on
     * the table's own unique constraint rather than a pre-check (safe under
     * concurrent settlement runs).
     */
    public function grant(
        int $userId,
        int $points,
        string $type,
        string $description,
        ?string $eventKey = null,
        ?CarbonInterface $weekStart = null,
        ?string $referenceType = null,
        ?int $referenceId = null,
        array $metadata = [],
    ): bool {
        try {
            QuizArenaPointLog::create([
                'user_id' => $userId,
                'points' => $points,
                'type' => $type,
                'event_key' => $eventKey,
                'description' => $description,
                'week_start' => $weekStart?->toDateString(),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'metadata' => $metadata ?: null,
            ]);

            return true;
        } catch (QueryException $exception) {
            return false;
        }
    }

    public function grantStarterBonus(int $userId): void
    {
        $this->grant(
            $userId,
            self::STARTER_BONUS_POINTS,
            'starter_bonus',
            'Bonus akaun baharu',
            "starter_bonus:user:{$userId}",
        );
    }

    /**
     * The shop catalog with each reward's "owned" state for this user
     * (theme rewards the student already unlocked can't be bought again).
     */
    public function rewardsCatalog(int $userId): array
    {
        $rewards = QuizArenaReward::where('is_active', true)->orderBy('sort_order')->get();

        $ownedThemeSlugs = DB::table('student_dashboard_theme_unlocks')
            ->join('dashboard_themes', 'dashboard_themes.id', '=', 'student_dashboard_theme_unlocks.dashboard_theme_id')
            ->where('student_dashboard_theme_unlocks.user_id', $userId)
            ->pluck('dashboard_themes.slug');

        return $rewards->map(fn (QuizArenaReward $reward) => [
            'id' => $reward->id,
            'title' => $reward->title,
            'description' => $reward->description,
            'type' => $reward->type,
            'points_cost' => $reward->points_cost,
            'icon' => $reward->icon,
            'owned' => (bool) ($reward->theme_slug && $ownedThemeSlugs->contains($reward->theme_slug)),
        ])->all();
    }

    public function claimReward(User $user, QuizArenaReward $reward): void
    {
        if (! $reward->is_active) {
            throw ValidationException::withMessages(['reward' => 'Hadiah ini tidak lagi tersedia.']);
        }

        DB::transaction(function () use ($user, $reward) {
            if ($this->balance($user->id) < $reward->points_cost) {
                throw ValidationException::withMessages(['reward' => 'Point anda tidak mencukupi untuk hadiah ini.']);
            }

            $theme = $reward->theme_slug ? DashboardTheme::where('slug', $reward->theme_slug)->first() : null;

            if ($theme) {
                $alreadyOwned = DB::table('student_dashboard_theme_unlocks')
                    ->where('user_id', $user->id)
                    ->where('dashboard_theme_id', $theme->id)
                    ->exists();

                if ($alreadyOwned) {
                    throw ValidationException::withMessages(['reward' => 'Anda sudah memiliki tema ini.']);
                }
            }

            $claim = QuizArenaRewardClaim::create([
                'user_id' => $user->id,
                'quiz_arena_reward_id' => $reward->id,
                'points_cost' => $reward->points_cost,
                'claimed_at' => now(),
            ]);

            $this->grant(
                userId: $user->id,
                points: -$reward->points_cost,
                type: 'reward_claim',
                description: "Tebus hadiah: {$reward->title}",
                eventKey: "reward_claim:{$claim->id}",
                referenceType: 'quiz_arena_reward_claim',
                referenceId: $claim->id,
            );

            if ($theme) {
                DB::table('student_dashboard_theme_unlocks')->insert([
                    'user_id' => $user->id,
                    'dashboard_theme_id' => $theme->id,
                    'source' => 'quiz_arena_shop',
                    'unlocked_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }
}
