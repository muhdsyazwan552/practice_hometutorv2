<?php

namespace Tests\Feature;

use App\Models\QuizArenaPointLog;
use App\Models\QuizArenaReward;
use App\Models\QuizArenaSession;
use App\Models\Student;
use App\Models\User;
use App\Services\QuizArenaService;
use App\Services\QuizArenaWalletService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class QuizArenaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('level', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
        });

        // Queried unconditionally by HandleInertiaRequests::share() for any
        // authenticated child on every Inertia page, including this one.
        Schema::create('subject', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbr')->nullable();
            $table->unsignedBigInteger('level_id')->nullable();
            $table->unsignedInteger('seq')->default(0);
            $table->boolean('is_active')->default(true);
        });
        Schema::create('dashboard_themes', function (Blueprint $table) {
            $table->id();
            $table->string('slug');
            $table->string('name');
            $table->unsignedInteger('points_cost')->default(0);
            $table->json('config')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
        });
        Schema::create('student_dashboard_theme_unlocks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('dashboard_theme_id');
            $table->string('source')->nullable();
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('level_id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->string('name');
            $table->boolean('is_active')->default(true);
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->text('question_text')->nullable();
            $table->string('question_file')->nullable();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedTinyInteger('question_type_id')->default(1);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_published')->default(true);
        });

        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->string('answer_text');
            $table->string('answer_option_file')->nullable();
            $table->boolean('iscorrectanswer')->default(false);
            $table->boolean('isactive')->default(true);
            $table->text('reason')->nullable();
            $table->text('reason2')->nullable();
            $table->string('reason_file')->nullable();
        });

        DB::table('level')->insert(['id' => 1, 'name' => 'Standard 1', 'is_active' => true]);
        DB::table('topics')->insert([
            ['id' => 10, 'subject_id' => 1, 'level_id' => 1, 'name' => 'Math Topic', 'is_active' => true],
            ['id' => 20, 'subject_id' => 2, 'level_id' => 1, 'name' => 'Science Topic', 'is_active' => true],
        ]);

        // 12 questions spread across 2 subjects/topics so a 10-question pull is satisfiable.
        foreach (range(1, 12) as $index) {
            $topicId = $index <= 6 ? 10 : 20;
            $questionId = 1000 + $index;
            DB::table('questions')->insert([
                'id' => $questionId,
                'question_text' => "Question {$index}",
                'topic_id' => $topicId,
                'question_type_id' => 1,
                'is_active' => true,
                'is_published' => true,
            ]);
            DB::table('answers')->insert([
                ['question_id' => $questionId, 'answer_text' => 'Correct', 'iscorrectanswer' => true, 'isactive' => true],
                ['question_id' => $questionId, 'answer_text' => 'Wrong', 'iscorrectanswer' => false, 'isactive' => true],
            ]);
        }
    }

    private function childWithLevel(int $levelId = 1): User
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        Student::create(['user_id' => $child->id, 'code' => 'HT-'.$child->id, 'full_name' => $child->name, 'level_id' => $levelId]);

        return $child->fresh();
    }

    public function test_weekday_is_closed_and_rejects_start(): void
    {
        Carbon::setTestNow(CarbonImmutable::parse('2026-09-21 09:00:00', QuizArenaService::TIMEZONE)); // Monday
        $child = $this->childWithLevel();

        $this->actingAs($child)->get(route('quiz-arena.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('isOpen', false));

        $this->actingAs($child)->postJson(route('quiz-arena.start'))->assertStatus(403);
        $this->assertDatabaseCount('quiz_arena_sessions', 0);
    }

    public function test_weekend_start_creates_session_with_ten_questions_across_subjects(): void
    {
        Carbon::setTestNow(CarbonImmutable::parse('2026-09-19 10:00:00', QuizArenaService::TIMEZONE)); // Saturday
        $child = $this->childWithLevel();

        $response = $this->actingAs($child)->postJson(route('quiz-arena.start'))->assertOk();
        $session = QuizArenaSession::firstOrFail();

        $this->assertSame(10, $session->total_questions);
        $this->assertCount(10, $session->question_ids);
        $topicsUsed = DB::table('questions')->whereIn('id', $session->question_ids)->pluck('topic_id')->unique();
        $this->assertGreaterThan(1, $topicsUsed->count(), 'Expected questions to span more than one topic/subject.');
        $this->assertSame('2026-09-19', $session->weekend_date->toDateString());
        $this->assertSame($response->json('session_uuid'), $session->uuid);
    }

    public function test_answering_all_questions_completes_the_session(): void
    {
        Carbon::setTestNow(CarbonImmutable::parse('2026-09-19 10:00:00', QuizArenaService::TIMEZONE));
        $child = $this->childWithLevel();

        $start = $this->actingAs($child)->postJson(route('quiz-arena.start'))->assertOk();
        $sessionUuid = $start->json('session_uuid');

        for ($i = 0; $i < 10; $i++) {
            $questionResponse = $this->actingAs($child)->getJson(route('quiz-arena.question', ['session_uuid' => $sessionUuid]))->assertOk();
            if ($questionResponse->json('completed')) {
                break;
            }
            $questionId = $questionResponse->json('question.id');
            $correctAnswerId = DB::table('answers')->where('question_id', $questionId)->where('iscorrectanswer', true)->value('id');

            $this->actingAs($child)->postJson(route('quiz-arena.answer'), [
                'session_uuid' => $sessionUuid,
                'question_id' => $questionId,
                'answer_id' => $correctAnswerId,
                'time_taken' => 5,
            ])->assertOk();
        }

        $session = QuizArenaSession::firstOrFail();
        $this->assertSame(QuizArenaSession::STATUS_COMPLETED, $session->status);
        $this->assertSame(10, $session->correct_answers);
        $this->assertSame(50, $session->total_time_seconds);
        $this->assertDatabaseCount('quiz_arena_attempts', 10);
    }

    public function test_second_start_after_completion_is_rejected(): void
    {
        Carbon::setTestNow(CarbonImmutable::parse('2026-09-19 10:00:00', QuizArenaService::TIMEZONE));
        $child = $this->childWithLevel();

        QuizArenaSession::create([
            'user_id' => $child->id,
            'level_id' => 1,
            'weekend_date' => '2026-09-19',
            'question_ids' => range(1001, 1010),
            'status' => QuizArenaSession::STATUS_COMPLETED,
            'total_questions' => 10,
            'correct_answers' => 7,
            'total_time_seconds' => 80,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        $this->actingAs($child)->postJson(route('quiz-arena.start'))
            ->assertStatus(400);
        $this->assertDatabaseCount('quiz_arena_sessions', 1);
    }

    public function test_settle_weekend_ranks_sessions_and_awards_tiered_points(): void
    {
        $weekendDate = CarbonImmutable::parse('2026-09-19', QuizArenaService::TIMEZONE);
        $students = collect(range(1, 4))->map(fn () => $this->childWithLevel());

        // Scores: 10/30s (best), 10/50s, 8/anything, 5/anything (participant tier).
        $rows = [
            ['user' => $students[0], 'correct' => 10, 'time' => 30],
            ['user' => $students[1], 'correct' => 10, 'time' => 50],
            ['user' => $students[2], 'correct' => 8, 'time' => 40],
            ['user' => $students[3], 'correct' => 5, 'time' => 40],
        ];

        foreach ($rows as $row) {
            QuizArenaSession::create([
                'user_id' => $row['user']->id,
                'level_id' => 1,
                'weekend_date' => $weekendDate->toDateString(),
                'question_ids' => range(1001, 1010),
                'status' => QuizArenaSession::STATUS_COMPLETED,
                'total_questions' => 10,
                'correct_answers' => $row['correct'],
                'total_time_seconds' => $row['time'],
                'started_at' => now(),
                'completed_at' => now(),
            ]);
        }

        app(QuizArenaService::class)->settleWeekend($weekendDate);

        $ranked = QuizArenaSession::orderBy('rank')->get()->keyBy('user_id');
        $this->assertSame(1, $ranked[$students[0]->id]->rank);
        $this->assertSame(50, $ranked[$students[0]->id]->points_awarded);
        $this->assertSame(2, $ranked[$students[1]->id]->rank);
        $this->assertSame(30, $ranked[$students[1]->id]->points_awarded);
        $this->assertSame(3, $ranked[$students[2]->id]->rank);
        $this->assertSame(20, $ranked[$students[2]->id]->points_awarded);
        $this->assertSame(4, $ranked[$students[3]->id]->rank);
        $this->assertSame(5, $ranked[$students[3]->id]->points_awarded);

        // Settlement also credits the wallet ledger, on top of each student's
        // 300-point new-account starter bonus (granted when childWithLevel()
        // created their Student record).
        $wallet = app(QuizArenaWalletService::class);
        $this->assertSame(350, $wallet->balance($students[0]->id));
        $this->assertSame(305, $wallet->balance($students[3]->id));

        $winnerLog = QuizArenaPointLog::where('user_id', $students[0]->id)->where('type', 'quiz_arena_weekend')->first();
        $this->assertNotNull($winnerLog);
        $this->assertSame('2026-09-19', $winnerLog->week_start->toDateString());

        // Re-running settlement must not double-award (idempotent via event_key).
        app(QuizArenaService::class)->settleWeekend($weekendDate);
        $this->assertSame(350, $wallet->balance($students[0]->id));
    }

    public function test_new_student_receives_a_one_time_starter_bonus(): void
    {
        $child = $this->childWithLevel();

        $wallet = app(QuizArenaWalletService::class);
        $this->assertSame(QuizArenaWalletService::STARTER_BONUS_POINTS, $wallet->balance($child->id));
        $this->assertDatabaseCount('quiz_arena_point_logs', 1);
    }

    public function test_wallet_endpoint_returns_balance_rewards_and_log(): void
    {
        $child = $this->childWithLevel();
        QuizArenaReward::create(['title' => 'Test Theme', 'type' => 'theme', 'points_cost' => 100, 'theme_slug' => 'ocean-blue', 'is_active' => true]);

        $response = $this->actingAs($child)->getJson(route('quiz-arena.wallet'))->assertOk();

        $this->assertSame(QuizArenaWalletService::STARTER_BONUS_POINTS, $response->json('balance'));
        $this->assertCount(1, $response->json('rewards'));
        $this->assertCount(1, $response->json('log'));
    }

    public function test_claiming_a_reward_deducts_points_and_unlocks_the_theme(): void
    {
        $child = $this->childWithLevel();
        DB::table('dashboard_themes')->insert(['id' => 50, 'slug' => 'ocean-blue', 'name' => 'Ocean Blue', 'points_cost' => 0, 'is_active' => true]);
        $reward = QuizArenaReward::create(['title' => 'Ocean Blue', 'type' => 'theme', 'points_cost' => 100, 'theme_slug' => 'ocean-blue', 'is_active' => true]);

        $response = $this->actingAs($child)->postJson(route('quiz-arena.rewards.claim', ['reward' => $reward->id]))->assertOk();

        $this->assertSame(QuizArenaWalletService::STARTER_BONUS_POINTS - 100, $response->json('balance'));
        $this->assertDatabaseHas('quiz_arena_reward_claims', ['user_id' => $child->id, 'quiz_arena_reward_id' => $reward->id]);
        $this->assertDatabaseHas('student_dashboard_theme_unlocks', ['user_id' => $child->id, 'dashboard_theme_id' => 50, 'source' => 'quiz_arena_shop']);

        // Claiming the same (now-owned) theme again is rejected.
        $this->actingAs($child)->postJson(route('quiz-arena.rewards.claim', ['reward' => $reward->id]))->assertStatus(422);
    }

    public function test_claiming_a_reward_without_enough_points_is_rejected(): void
    {
        $child = $this->childWithLevel();
        $reward = QuizArenaReward::create(['title' => 'Expensive Theme', 'type' => 'theme', 'points_cost' => 5000, 'theme_slug' => 'gold-champion', 'is_active' => true]);

        $this->actingAs($child)->postJson(route('quiz-arena.rewards.claim', ['reward' => $reward->id]))
            ->assertStatus(422);
        $this->assertDatabaseCount('quiz_arena_reward_claims', 0);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }
}
