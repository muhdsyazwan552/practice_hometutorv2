<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class StudentDataIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Legacy tables that are not built by migrations.
        Schema::create('level', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_active')->default(true);
        });
        Schema::create('subject', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbr')->nullable();
            $table->unsignedBigInteger('level_id')->nullable();
            $table->unsignedInteger('seq')->default(0);
            $table->boolean('is_active')->default(true);
        });
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedTinyInteger('question_type_id')->default(1);
        });
        Schema::create('mastery_challenge_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('level_id')->nullable();
            $table->string('status');
            $table->unsignedInteger('total_questions')->default(5);
            $table->unsignedInteger('correct_answers')->default(0);
            $table->unsignedInteger('total_time_seconds')->default(0);
            $table->timestamps();
        });
        Schema::create('mastery_challenge_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('question_id');
            $table->unsignedInteger('question_order')->default(1);
        });
        Schema::create('mastery_challenge_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('question_id');
        });
        Schema::create('friends', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('friend_id');
            $table->timestamps();
        });
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_group')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        DB::table('level')->insert(['id' => 1, 'name' => 'Standard 1']);
        DB::table('questions')->insert([['id' => 1, 'topic_id' => 10], ['id' => 2, 'topic_id' => 10]]);
    }

    private function child(): User
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        Student::create(['user_id' => $child->id, 'code' => 'HT-'.$child->id, 'full_name' => $child->name, 'level_id' => 1]);

        return $child->fresh();
    }

    private function challengeSessionFor(User $owner): int
    {
        $sessionId = DB::table('mastery_challenge_sessions')->insertGetId([
            'user_id' => $owner->id, 'subject_id' => 1, 'level_id' => 1, 'status' => 'in_progress',
        ]);
        DB::table('mastery_challenge_questions')->insert(['session_id' => $sessionId, 'question_id' => 1]);

        return $sessionId;
    }

    public function test_a_student_cannot_answer_or_read_another_students_challenge_session(): void
    {
        $sessionId = $this->challengeSessionFor($this->child());
        $intruder = $this->child();

        $this->actingAs($intruder)->postJson(route('mission.challenge.answer'), [
            'session_id' => $sessionId, 'question_id' => 1, 'answer_id' => 1, 'time_taken' => 5,
        ])->assertStatus(400);
        $this->actingAs($intruder)->postJson(route('mission.practice.answer'), [
            'session_id' => $sessionId, 'question_id' => 1, 'answer_id' => 1, 'time_taken' => 5,
        ])->assertStatus(400);

        foreach (['mission.challenge.question', 'mission.challenge.summary', 'mission.practice.question', 'mission.practice.summary'] as $route) {
            $this->actingAs($intruder)->getJson(route($route, ['session_id' => $sessionId]))->assertNotFound();
        }

        $this->assertDatabaseCount('mastery_challenge_attempts', 0);
    }

    public function test_a_question_outside_the_session_is_rejected(): void
    {
        $owner = $this->child();
        $sessionId = $this->challengeSessionFor($owner);

        $this->actingAs($owner)->postJson(route('mission.challenge.answer'), [
            'session_id' => $sessionId, 'question_id' => 2, 'answer_id' => 1, 'time_taken' => 5,
        ])->assertStatus(422);

        $this->actingAs($owner)->postJson(route('mission.challenge.answer'), [
            'session_id' => $sessionId, 'question_id' => 1, 'answer_id' => 1, 'time_taken' => -500,
        ])->assertStatus(422);

        $this->assertDatabaseCount('mastery_challenge_attempts', 0);
    }

    public function test_a_group_chat_can_only_include_friends(): void
    {
        $student = $this->child();
        $friend = $this->child();
        $stranger = $this->child();
        DB::table('friends')->insert(['user_id' => $friend->id, 'friend_id' => $student->id]);

        $this->actingAs($student)->postJson('/chat/create-group', [
            'name' => 'Kumpulan', 'participants' => [$friend->id, $stranger->id],
        ])->assertForbidden();

        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_a_student_cannot_befriend_themselves(): void
    {
        $student = $this->child();

        $this->actingAs($student)->postJson(route('friends.send-request'), ['receiver_id' => $student->id])
            ->assertStatus(422);
    }

    public function test_the_question_dump_debug_route_is_gone(): void
    {
        $this->actingAs($this->child())->get('/test-questions/10')->assertNotFound();
    }

    public function test_responses_carry_security_headers(): void
    {
        $this->get('/login')
            ->assertHeader('Content-Security-Policy', "frame-ancestors 'self'")
            ->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}
