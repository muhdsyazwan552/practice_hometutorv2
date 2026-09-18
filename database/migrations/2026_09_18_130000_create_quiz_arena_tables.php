<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_arena_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('level_id');
            $table->date('weekend_date')->index();
            $table->json('question_ids');
            $table->string('status', 20)->default('in_progress')->index();
            $table->unsignedTinyInteger('total_questions')->default(0);
            $table->unsignedTinyInteger('correct_answers')->default(0);
            $table->unsignedInteger('total_time_seconds')->default(0);
            $table->unsignedTinyInteger('rank')->nullable();
            $table->unsignedInteger('points_awarded')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'weekend_date']);
            $table->index(['level_id', 'weekend_date', 'status']);
        });

        Schema::create('quiz_arena_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('quiz_arena_sessions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('question_id');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('topic_id')->nullable();
            $table->unsignedBigInteger('chosen_answer_id')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->unsignedInteger('time_taken_seconds')->default(0);
            $table->timestamp('created_at')->nullable();

            $table->unique(['session_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_arena_attempts');
        Schema::dropIfExists('quiz_arena_sessions');
    }
};
