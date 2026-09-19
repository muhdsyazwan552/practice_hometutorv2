<?php

namespace App\Console\Commands;

use App\Models\ChildSubscription;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncChildSubscriptionStatus extends Command
{
    protected $signature = 'subscriptions:sync-status';

    protected $description = 'Expire child subscriptions past ends_at and activate scheduled renewals whose start time has arrived.';

    public function handle(): int
    {
        $now = now();

        [$expired, $activated] = DB::transaction(function () use ($now) {
            // Expire first, so a renewal that starts exactly when the old one ends
            // never overlaps it as a second active record.
            $expired = ChildSubscription::query()
                ->whereIn('status', [ChildSubscription::STATUS_ACTIVE, ChildSubscription::STATUS_SCHEDULED])
                ->where('ends_at', '<=', $now)
                ->update(['status' => ChildSubscription::STATUS_EXPIRED, 'updated_at' => $now]);

            $activated = ChildSubscription::query()
                ->where('status', ChildSubscription::STATUS_SCHEDULED)
                ->where('starts_at', '<=', $now)
                ->where('ends_at', '>', $now)
                ->update(['status' => ChildSubscription::STATUS_ACTIVE, 'updated_at' => $now]);

            return [$expired, $activated];
        });

        if ($expired || $activated) {
            Log::notice('Child subscription statuses synced.', ['expired' => $expired, 'activated' => $activated]);
        }

        $this->info("Expired {$expired}, activated {$activated} child subscription(s).");

        return self::SUCCESS;
    }
}
