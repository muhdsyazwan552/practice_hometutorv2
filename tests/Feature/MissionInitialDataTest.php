<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureChildHasActiveSubscription;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use App\Services\MasteryService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery;
use Tests\TestCase;

class MissionInitialDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_mission_page_includes_data_needed_on_first_render(): void
    {
        $this->withoutMiddleware([HandleInertiaRequests::class, EnsureChildHasActiveSubscription::class]);

        Schema::create('level', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbr')->nullable();
            $table->boolean('is_active');
        });
        Schema::create('subject', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbr');
            $table->unsignedBigInteger('level_id');
            $table->boolean('is_active');
        });
        DB::table('level')->insert(['id' => 1, 'name' => 'Standard 1', 'is_active' => 1]);
        DB::table('subject')->insert(['id' => 11, 'name' => 'English', 'abbr' => 'EN', 'level_id' => 1, 'is_active' => 1]);

        $user = User::factory()->create();
        DB::table('students')->insert(['code' => 'mission-test', 'user_id' => $user->id, 'level_id' => 1]);

        $topics = collect([['id' => 3438, 'name' => 'The Robot']]);
        $progress = ['percentage' => 25, 'skills' => ['mastered' => 1], 'topics' => []];
        $skills = collect([['id' => 3440, 'name' => 'Thinking skills']]);
        $mastery = Mockery::mock(MasteryService::class);
        $mastery->shouldReceive('getTopicsWithMastery')->once()->andReturn($topics);
        $mastery->shouldReceive('getMissionProgress')->once()->with($user->id, 11, 1, $topics)->andReturn($progress);
        $mastery->shouldReceive('getMissionSubtopics')->once()->with($user->id, 11, 1, $topics)->andReturn($skills);
        $mastery->shouldReceive('getQuestionsPerSession')->once()->andReturn(10);
        $this->app->instance(MasteryService::class, $mastery);

        $this->actingAs($user)
            ->get('/subject/EN/mission?subject_id=11&level_id=1&form=Standard%201')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('courses/SubjectMissionPage')
                ->where('initialProgress.percentage', 25)
                ->where('initialSkills.0.id', 3440)
                ->where('initialChallenge.question_count', 10));
    }
}
