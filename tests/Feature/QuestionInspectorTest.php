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
}
