<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class QuestionInspectorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The global Inertia share queries unrelated legacy theme tables.
        $this->withoutMiddleware(\App\Http\Middleware\HandleInertiaRequests::class);
    }

    public function test_only_designated_account_can_open_inspector(): void
    {
        $this->get('/question-inspector')->assertRedirect('/login');

        $this->actingAs(User::factory()->create())
            ->get('/question-inspector?q=990522')
            ->assertForbidden();

        $this->actingAs(User::factory()->unverified()->create(['email' => 'tasya@children.hometutor.local']))
            ->get('/question-inspector')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('QuestionInspector')->where('details', null));
    }

    public function test_designated_account_can_find_question_and_see_diagnostics(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('question_code');
            $table->text('question_text');
            $table->string('question_file')->nullable();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedInteger('question_type_id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->boolean('is_active');
            $table->boolean('is_published');
            $table->boolean('approval_status')->default(true);
        });
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->text('answer_text')->nullable();
            $table->unsignedInteger('seq')->default(0);
            $table->boolean('isactive');
        });
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('level_id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->boolean('is_active');
            $table->boolean('is_published');
        });
        Schema::create('subject', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
        Schema::create('level', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });

        DB::table('subject')->insert(['id' => 1, 'name' => 'English']);
        DB::table('level')->insert(['id' => 1, 'name' => 'Standard 1']);
        DB::table('topics')->insert(['id' => 3438, 'name' => 'The Robot', 'subject_id' => 1, 'level_id' => 1, 'parent_id' => 0, 'is_active' => 1, 'is_published' => 1]);
        DB::table('questions')->insert(['id' => 990522, 'question_code' => '00990522', 'question_text' => '<p>Complete the word.</p>', 'topic_id' => 3438, 'question_type_id' => 2, 'is_active' => 1, 'is_published' => 1]);
        DB::table('answers')->insert(['id' => 800472, 'question_id' => 990522, 'answer_text' => 'BIKE', 'isactive' => 1]);

        $this->actingAs(User::factory()->create(['email' => 'tasya@children.hometutor.local']))
            ->get('/question-inspector?q=00990522')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuestionInspector')
                ->where('details.question.id', 990522)
                ->where('details.diagnostics.practice_type', 'Subjektif')
                ->where('details.diagnostics.in_practice_pool', true)
                ->where('details.preview.answers.0.text', 'BIKE')
                ->has('details.answers', 1));
    }

    public function test_verdict_flags_problems_and_batch_reports_each_input(): void
    {
        $this->createInspectorTables();
        DB::table('subject')->insert(['id' => 1, 'name' => 'Science']);
        DB::table('level')->insert(['id' => 1, 'name' => 'Standard 1']);
        DB::table('topics')->insert(['id' => 10, 'name' => 'Plants', 'subject_id' => 1, 'level_id' => 1, 'parent_id' => 0, 'is_active' => 1, 'is_published' => 1]);
        DB::table('questions')->insert([
            ['id' => 1, 'question_code' => 'GOOD1', 'question_text' => '<p>Pick</p>', 'topic_id' => 10, 'question_type_id' => 1, 'is_active' => 1, 'is_published' => 1, 'approval_status' => 1],
            ['id' => 2, 'question_code' => 'BAD2', 'question_text' => '<p>Pick</p>', 'topic_id' => 10, 'question_type_id' => 1, 'is_active' => 0, 'is_published' => 1, 'approval_status' => 1],
        ]);
        DB::table('answers')->insert([
            ['question_id' => 1, 'answer_text' => 'A', 'isactive' => 1, 'iscorrectanswer' => 1],
            ['question_id' => 1, 'answer_text' => 'B', 'isactive' => 1, 'iscorrectanswer' => 0],
            ['question_id' => 2, 'answer_text' => 'A', 'isactive' => 1, 'iscorrectanswer' => 0],
            ['question_id' => 2, 'answer_text' => 'A', 'isactive' => 0, 'iscorrectanswer' => 0],
        ]);
        $user = User::factory()->create(['email' => 'tasya@children.hometutor.local']);

        $this->actingAs($user)->get('/question-inspector?q=BAD2')->assertInertia(fn (Assert $page) => $page
            ->where('details.verdict.available', false)
            ->where('details.verdict.level', 'fail')
            ->where('details.checks', fn ($checks) => collect($checks)->contains(fn ($c) => $c['key'] === 'correct' && $c['level'] === 'fail')));

        $this->actingAs($user)->get('/question-inspector?q=GOOD1')->assertInertia(fn (Assert $page) => $page
            ->where('details.verdict.available', true)
            ->where('details.verdict.level', 'warn')); // only 1 eligible question in the topic, below the session limit

        $this->actingAs($user)->post('/question-inspector/batch', ['codes' => "GOOD1\n2, NOPE"])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('QuestionInspector')
                ->has('batch.rows', 3)
                ->where('batch.rows.0.code', 'GOOD1')
                ->where('batch.rows.1.available', false)
                ->where('batch.rows.2.level', 'missing'));

        $this->actingAs(User::factory()->create())->post('/question-inspector/batch', ['codes' => '1'])->assertForbidden();
    }

    private function createInspectorTables(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('question_code');
            $table->text('question_text');
            $table->string('question_file')->nullable();
            $table->unsignedBigInteger('topic_id');
            $table->unsignedInteger('question_type_id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->boolean('is_active');
            $table->boolean('is_published');
            $table->boolean('approval_status')->default(true);
        });
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('question_id');
            $table->text('answer_text')->nullable();
            $table->boolean('iscorrectanswer')->default(false);
            $table->unsignedInteger('seq')->default(0);
            $table->boolean('isactive');
        });
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('level_id');
            $table->unsignedBigInteger('parent_id')->default(0);
            $table->boolean('is_active');
            $table->boolean('is_published');
        });
        Schema::create('subject', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
        Schema::create('level', function (Blueprint $table) {
            $table->id();
            $table->string('name');
        });
    }
}
