<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class MissionPartialSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedBigInteger('subject_id')->default(1);
            $table->unsignedBigInteger('level_id')->default(1);
            $table->boolean('is_active')->default(true);
        });
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->unsignedInteger('question_type_id')->default(1);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_published')->default(true);
            $table->boolean('approval_status')->default(true);
        });
        Schema::create('mastery_challenge_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('level_id');
            $table->string('session_type');
            $table->string('mission_scope')->default('subject');
            $table->string('status');
            $table->unsignedInteger('total_questions');
            $table->unsignedInteger('correct_answers')->default(0);
            $table->unsignedInteger('total_time_seconds')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('mastery_challenge_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('question_id');
            $table->unsignedInteger('question_order');
            $table->timestamp('created_at')->nullable();
        });
        Schema::create('mastery_challenge_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('question_id');
            $table->unsignedBigInteger('topic_id');
            $table->unsignedBigInteger('subtopic_id')->nullable();
            $table->unsignedBigInteger('choosen_answer_id');
            $table->boolean('is_correct');
            $table->unsignedInteger('time_taken_seconds');
            $table->timestamp('created_at');
        });
        Schema::create('practice_session', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid');
            $table->unsignedBigInteger('mastery_session_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('level_id')->nullable();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedBigInteger('subtopic_id')->nullable();
            $table->unsignedInteger('question_type_id');
            $table->string('session_type');
            $table->string('mission_scope')->nullable();
            $table->string('status')->default('completed');
            $table->unsignedInteger('total_questions');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->unsignedInteger('total_correct');
            $table->unsignedInteger('total_skipped');
            $table->float('score');
            $table->unsignedInteger('total_time_seconds');
            $table->timestamps();
        });
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('parent_id');
            $table->unsignedBigInteger('question_id');
            $table->unsignedBigInteger('topic_id');
            $table->unsignedBigInteger('subtopic_id')->nullable();
            $table->unsignedBigInteger('choosen_answer_id');
            $table->boolean('answer_status');
            $table->text('subjective_answer')->nullable();
            $table->unsignedBigInteger('session_id');
            $table->unsignedInteger('time_taken');
            $table->unsignedInteger('question_type_id');
            $table->timestamps();
        });

        DB::table('topics')->insert(['id' => 10, 'name' => 'Sample topic']);
        DB::table('questions')->insert([
            ['id' => 101, 'topic_id' => 10],
            ['id' => 102, 'topic_id' => 10],
            ['id' => 103, 'topic_id' => 10],
            ['id' => 104, 'topic_id' => 10],
            ['id' => 105, 'topic_id' => 10],
            ['id' => 106, 'topic_id' => 10],
            ['id' => 107, 'topic_id' => 10],
            ['id' => 108, 'topic_id' => 10],
            ['id' => 109, 'topic_id' => 10],
            ['id' => 110, 'topic_id' => 10],
        ]);
    }

    private function missionFor(User $user, string $type = 'mission', int $totalQuestions = 10): int
    {
        $sessionId = DB::table('practice_session')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'subject_id' => 1,
            'level_id' => 1,
            'topic_id' => 10,
            'question_type_id' => 1,
            'session_type' => $type,
            'mission_scope' => 'subject',
            'status' => 'in_progress',
            'total_questions' => $totalQuestions,
            'total_correct' => 0,
            'total_skipped' => $totalQuestions,
            'score' => 0,
            'total_time_seconds' => 0,
            'start_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('mastery_challenge_questions')->insert(array_map(
            fn ($index) => ['session_id' => $sessionId, 'question_id' => 101 + $index, 'question_order' => $index + 1],
            range(0, 4),
        ));

        return $sessionId;
    }

    private function student(): User
    {
        $user = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        Student::create(['user_id' => $user->id, 'code' => 'MISSION-'.$user->id, 'full_name' => $user->name, 'level_id' => 1]);

        return $user;
    }

    public function test_subtopic_mission_starts_with_ten_questions_and_mission_type(): void
    {
        $user = $this->student();

        $response = $this->actingAs($user)->postJson(route('mission.subtopic.start'), [
            'subject_id' => 1,
            'level_id' => 1,
            'topic_id' => 10,
        ])->assertOk()->assertJsonPath('total_questions', 10);

        $this->assertDatabaseHas('practice_session', [
            'id' => $response->json('session_id'),
            'session_type' => 'mission',
            'mission_scope' => 'subtopic',
            'total_questions' => 10,
        ]);
        $this->assertSame(10, DB::table('mastery_challenge_questions')
            ->where('session_id', $response->json('session_id'))->count());
    }

    public function test_quitting_before_the_first_answer_does_not_create_a_report_session(): void
    {
        $user = $this->student();
        $sessionId = $this->missionFor($user);

        $this->actingAs($user)->postJson(route('mission.challenge.save-progress'), ['session_id' => $sessionId])
            ->assertOk()
            ->assertJson(['saved' => false, 'answered_count' => 0]);

        $this->assertDatabaseCount('practice_session', 1);
        $this->assertDatabaseCount('quiz_attempts', 0);
    }

    public function test_quitting_subtopic_mission_before_the_first_answer_does_not_create_a_report_session(): void
    {
        $user = $this->student();
        $sessionId = $this->missionFor($user, 'mission', 10);

        $this->actingAs($user)->postJson(route('mission.subtopic.save-progress'), ['session_id' => $sessionId])
            ->assertOk()
            ->assertJson(['saved' => false, 'answered_count' => 0]);

        $this->assertDatabaseCount('practice_session', 1);
    }

    public function test_resuming_updates_the_same_report_session_with_submitted_answers(): void
    {
        $user = $this->student();
        $sessionId = $this->missionFor($user);
        $this->actingAs($user);
        foreach ([101, 102, 103, 104, 105] as $index => $questionId) {
            DB::table('mastery_challenge_attempts')->insert([
                'session_id' => $sessionId,
                'user_id' => $user->id,
                'question_id' => $questionId,
                'topic_id' => 10,
                'choosen_answer_id' => $index + 1,
                'is_correct' => $index % 2 === 0,
                'time_taken_seconds' => 5,
                'created_at' => now(),
            ]);
            DB::table('practice_session')->where('id', $sessionId)->update([
                'total_correct' => intdiv($index, 2) + 1,
                'total_time_seconds' => ($index + 1) * 5,
            ]);
            $this->postJson(route('mission.challenge.save-progress'), ['session_id' => $sessionId])->assertOk();
        }

        $this->assertDatabaseCount('practice_session', 1);
        $this->assertDatabaseHas('practice_session', [
            'id' => $sessionId,
            'session_type' => 'mission',
            'total_questions' => 10,
            'total_correct' => 3,
            'total_skipped' => 5,
            'score' => 30,
        ]);
        $this->assertDatabaseCount('quiz_attempts', 5);
    }

    public function test_leaving_subtopic_mission_early_records_the_partial_ten_question_session(): void
    {
        $user = $this->student();
        $sessionId = $this->missionFor($user, 'mission', 10);
        DB::table('mastery_challenge_attempts')->insert([
            'session_id' => $sessionId,
            'user_id' => $user->id,
            'question_id' => 101,
            'topic_id' => 10,
            'choosen_answer_id' => 1,
            'is_correct' => 0,
            'time_taken_seconds' => 5,
            'created_at' => now(),
        ]);
        DB::table('practice_session')->where('id', $sessionId)->update(['total_correct' => 0, 'total_time_seconds' => 5]);

        $this->actingAs($user)
            ->postJson(route('mission.subtopic.save-progress'), ['session_id' => $sessionId])
            ->assertOk();

        $this->assertDatabaseHas('practice_session', [
            'id' => $sessionId,
            'session_type' => 'mission',
            'total_questions' => 10,
            'total_correct' => 0,
            'total_skipped' => 9,
            'score' => 0,
        ]);
        $this->assertDatabaseCount('quiz_attempts', 1);
    }

    public function test_another_student_cannot_save_this_mission(): void
    {
        $owner = $this->student();
        $sessionId = $this->missionFor($owner);

        $this->actingAs($this->student())
            ->postJson(route('mission.challenge.save-progress'), ['session_id' => $sessionId])
            ->assertNotFound();
        $this->assertDatabaseCount('practice_session', 1);
    }

    public function test_existing_ten_question_subtopic_session_is_migrated_as_one_mission_report(): void
    {
        $user = $this->student();
        DB::table('practice_session')->insert([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'subject_id' => 1,
            'topic_id' => 10,
            'question_type_id' => 1,
            'session_type' => 'practice',
            'total_questions' => 5,
            'total_correct' => 3,
            'total_skipped' => 0,
            'score' => 60,
            'total_time_seconds' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $sessionId = DB::table('mastery_challenge_sessions')->insertGetId([
            'user_id' => $user->id,
            'subject_id' => 1,
            'level_id' => 1,
            'session_type' => 'practice',
            'mission_scope' => 'subtopic',
            'status' => 'in_progress',
            'total_questions' => 10,
            'correct_answers' => 1,
            'total_time_seconds' => 5,
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('mastery_challenge_questions')->insert([
            'session_id' => $sessionId,
            'question_id' => 101,
            'question_order' => 1,
        ]);
        DB::table('mastery_challenge_attempts')->insert([
            'session_id' => $sessionId,
            'user_id' => $user->id,
            'question_id' => 101,
            'topic_id' => 10,
            'choosen_answer_id' => 1,
            'is_correct' => 1,
            'time_taken_seconds' => 5,
            'created_at' => now(),
        ]);
        DB::table('mastery_challenge_sessions')->insert([
            'user_id' => $user->id,
            'subject_id' => 1,
            'level_id' => 1,
            'session_type' => 'mission',
            'mission_scope' => 'subject',
            'status' => 'in_progress',
            'total_questions' => 10,
            'correct_answers' => 0,
            'total_time_seconds' => 0,
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $migration = require database_path('migrations/2026_10_21_000000_unify_mission_report_sessions.php');
        $migration->up();
        $migration->up();
        $finalMigration = require database_path('migrations/2026_10_21_010000_use_practice_session_for_missions.php');
        $finalMigration->up();

        $this->assertFalse(Schema::hasTable('mastery_challenge_sessions'));
        $this->assertDatabaseHas('practice_session', [
            'session_type' => 'mission',
            'total_questions' => 10,
            'total_skipped' => 9,
        ]);
        $this->assertDatabaseCount('practice_session', 3);
        $this->assertDatabaseCount('quiz_attempts', 1);
        $newSessionId = DB::table('practice_session')->where('session_type', 'mission')->where('mission_scope', 'subtopic')->value('id');
        $this->assertNotEquals($sessionId, $newSessionId);
        $this->assertDatabaseHas('mastery_challenge_questions', ['session_id' => $newSessionId, 'question_id' => 101]);
        $this->assertDatabaseHas('mastery_challenge_attempts', ['session_id' => $newSessionId, 'question_id' => 101]);
        $this->assertDatabaseHas('practice_session', [
            'session_type' => 'mission',
            'mission_scope' => 'subject',
            'status' => 'in_progress',
            'total_correct' => 0,
        ]);
    }
}
