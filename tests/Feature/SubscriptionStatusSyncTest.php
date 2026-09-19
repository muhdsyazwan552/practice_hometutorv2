<?php

namespace Tests\Feature;

use App\Models\ChildSubscription;
use App\Models\Package;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SubscriptionStatusSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('level', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbr')->nullable();
            $table->boolean('is_active')->default(true);
        });
        DB::table('level')->insert(['id' => 1, 'name' => 'Standard 1', 'abbr' => 'ST1', 'is_active' => true]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_early_renewal_hands_over_from_the_old_record_to_the_new_one(): void
    {
        Carbon::setTestNow('2026-01-01 08:00:00');
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $package = $this->package();
        $service = app(SubscriptionService::class);

        $old = $service->grantNew($child, $package, 30, ChildSubscription::SOURCE_ADMIN_MANUAL);
        Carbon::setTestNow('2026-01-21 08:00:00'); // renew with 10 days left
        $renewal = $service->renew($child, $package, 365, ChildSubscription::SOURCE_ADMIN_MANUAL);

        $this->assertSame(ChildSubscription::STATUS_SCHEDULED, $renewal->status);
        $this->artisan('subscriptions:sync-status')->assertSuccessful();
        $this->assertSame(ChildSubscription::STATUS_ACTIVE, $old->fresh()->status);
        $this->assertSame(ChildSubscription::STATUS_SCHEDULED, $renewal->fresh()->status);
        $this->assertSame($old->id, $child->activeChildSubscription()->id);

        // The old record ends: the renewal keeps access even before the command runs.
        Carbon::setTestNow('2026-01-31 08:00:01');
        $this->assertSame($renewal->id, $child->activeChildSubscription()?->id);

        $this->artisan('subscriptions:sync-status')->assertSuccessful();
        $this->assertSame(ChildSubscription::STATUS_EXPIRED, $old->fresh()->status);
        $this->assertSame(ChildSubscription::STATUS_ACTIVE, $renewal->fresh()->status);
        $this->assertSame($renewal->id, $child->activeChildSubscription()->id);
        $this->assertTrue($renewal->fresh()->ends_at->equalTo(Carbon::parse('2026-01-31 08:00:00')->addDays(365)));
    }

    public function test_an_ended_subscription_without_renewal_expires_and_blocks_access(): void
    {
        Carbon::setTestNow('2026-01-01 08:00:00');
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $subscription = app(SubscriptionService::class)->grantNew($child, $this->package(), 30, ChildSubscription::SOURCE_ADMIN_MANUAL);

        Carbon::setTestNow('2026-02-01 00:00:00');
        $this->artisan('subscriptions:sync-status')->assertSuccessful();

        $this->assertSame(ChildSubscription::STATUS_EXPIRED, $subscription->fresh()->status);
        $this->assertNull($child->activeChildSubscription());
    }

    public function test_cancelled_and_future_records_are_left_alone(): void
    {
        Carbon::setTestNow('2026-01-01 08:00:00');
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $package = $this->package();
        $cancelled = ChildSubscription::create(['child_user_id' => $child->id, 'package_id' => $package->id, 'status' => ChildSubscription::STATUS_CANCELLED, 'source' => 'test', 'starts_at' => now()->subDays(5), 'ends_at' => now()->addDays(5)]);
        $future = ChildSubscription::create(['child_user_id' => $child->id, 'package_id' => $package->id, 'status' => ChildSubscription::STATUS_SCHEDULED, 'source' => 'test', 'starts_at' => now()->addDays(5), 'ends_at' => now()->addDays(35)]);

        $this->artisan('subscriptions:sync-status')->assertSuccessful();

        $this->assertSame(ChildSubscription::STATUS_CANCELLED, $cancelled->fresh()->status);
        $this->assertSame(ChildSubscription::STATUS_SCHEDULED, $future->fresh()->status);
        $this->assertNull($child->activeChildSubscription());
    }

    public function test_the_sync_is_scheduled_every_five_minutes(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('subscriptions:sync-status')->assertSuccessful();
    }

    private function package(): Package
    {
        $package = Package::create([
            'name' => 'Standard 1–3',
            'code' => 'STD-1-3',
            'description' => 'Test child licence',
            'curriculum_group' => 'standard_1_3',
            'price' => 99,
            'currency' => 'MYR',
            'duration_days' => 365,
            'max_children' => 1,
            'is_active' => true,
        ]);
        $package->levels()->sync([1]);

        return $package;
    }
}
