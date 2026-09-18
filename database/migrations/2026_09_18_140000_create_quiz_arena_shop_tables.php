<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quiz_arena_point_logs')) {
            Schema::create('quiz_arena_point_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->integer('points');
                $table->string('type', 50);
                $table->string('event_key', 120)->nullable();
                $table->string('description', 255);
                $table->date('week_start')->nullable();
                $table->string('reference_type', 60)->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'event_key'], 'quiz_arena_point_event_unique');
                $table->index('user_id');
                $table->index('week_start');
            });
        }

        if (! Schema::hasTable('quiz_arena_rewards')) {
            Schema::create('quiz_arena_rewards', function (Blueprint $table) {
                $table->id();
                $table->string('title', 120);
                $table->string('description', 255)->nullable();
                $table->enum('type', ['voucher', 'theme', 'badge']);
                $table->unsignedInteger('points_cost');
                $table->string('icon', 20)->nullable();
                $table->string('theme_slug', 60)->nullable();
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('quiz_arena_reward_claims')) {
            Schema::create('quiz_arena_reward_claims', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('quiz_arena_reward_id');
                $table->unsignedInteger('points_cost');
                $table->timestamp('claimed_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index('user_id');
                $table->index('quiz_arena_reward_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_arena_reward_claims');
        Schema::dropIfExists('quiz_arena_rewards');
        Schema::dropIfExists('quiz_arena_point_logs');
    }
};
