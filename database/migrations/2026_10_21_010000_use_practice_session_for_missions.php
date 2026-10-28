<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('practice_session')) {
            return;
        }

        Schema::table('practice_session', function (Blueprint $table): void {
            if (! Schema::hasColumn('practice_session', 'level_id')) {
                $table->unsignedBigInteger('level_id')->nullable()->after('subject_id');
            }
            if (! Schema::hasColumn('practice_session', 'mission_scope')) {
                $table->string('mission_scope', 20)->nullable()->after('session_type');
            }
            if (! Schema::hasColumn('practice_session', 'status')) {
                $table->string('status', 20)->default('completed')->after('mission_scope');
            }
        });

        if (! Schema::hasTable('mastery_challenge_sessions')) {
            return;
        }

        DB::table('mastery_challenge_sessions')->orderBy('id')->chunkById(100, function ($sessions): void {
            foreach ($sessions as $session) {
                $firstQuestion = Schema::hasTable('mastery_challenge_questions')
                    ? DB::table('mastery_challenge_questions as selected')
                        ->join('questions as q', 'q.id', '=', 'selected.question_id')
                        ->where('selected.session_id', $session->id)
                        ->orderBy('selected.question_order')
                        ->value('q.topic_id')
                    : null;
                $topic = $firstQuestion && Schema::hasTable('topics')
                    ? DB::table('topics')->find($firstQuestion)
                    : null;
                $subtopicId = $topic && (int) ($topic->parent_id ?? 0) > 0 ? (int) $topic->id : null;
                $topicId = $subtopicId ? (int) $topic->parent_id : (int) ($topic->id ?? 0);
                $attemptCount = Schema::hasTable('mastery_challenge_attempts')
                    ? DB::table('mastery_challenge_attempts')->where('session_id', $session->id)->count()
                    : 0;
                $total = (int) $session->total_questions;

                $row = [
                    'user_id' => $session->user_id,
                    'subject_id' => $session->subject_id,
                    'level_id' => $session->level_id,
                    'topic_id' => $topicId,
                    'subtopic_id' => $subtopicId,
                    'question_type_id' => 1,
                    'session_type' => $session->session_type,
                    'mission_scope' => $session->mission_scope ?? ($session->session_type === 'mission' ? 'subject' : null),
                    'status' => $session->status ?? 'completed',
                    'total_questions' => $total,
                    'total_correct' => $session->correct_answers,
                    'total_skipped' => max(0, $total - $attemptCount),
                    'score' => $total > 0 ? round((int) $session->correct_answers * 100 / $total) : 0,
                    'total_time_seconds' => $session->total_time_seconds,
                    'start_at' => $session->started_at,
                    'end_at' => $session->completed_at,
                    'updated_at' => $session->updated_at,
                ];

                $existing = DB::table('practice_session')->where('mastery_session_id', $session->id)->first();
                if ($existing) {
                    DB::table('practice_session')->where('id', $existing->id)->update($row);
                } else {
                    DB::table('practice_session')->insert($row + [
                        'uuid' => (string) Str::uuid(),
                        'mastery_session_id' => $session->id,
                        'created_at' => $session->created_at,
                    ]);
                }
            }
        });

        // First use negative temporary IDs so old and new positive ID ranges cannot collide.
        foreach (['mastery_challenge_questions', 'mastery_challenge_attempts'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            DB::table($table)->where('session_id', '>', 0)->update(['session_id' => DB::raw('-session_id')]);
            DB::table('practice_session')->whereNotNull('mastery_session_id')->orderBy('id')
                ->chunkById(100, function ($sessions) use ($table): void {
                    foreach ($sessions as $session) {
                        DB::table($table)->where('session_id', -$session->mastery_session_id)
                            ->update(['session_id' => $session->id]);
                    }
                });
            if (DB::table($table)->where('session_id', '<', 0)->exists()) {
                throw new RuntimeException("Unmapped legacy session IDs remain in {$table}.");
            }
        }

        Schema::drop('mastery_challenge_sessions');
        Schema::table('practice_session', function (Blueprint $table): void {
            $table->dropColumn('mastery_session_id');
        });
    }

    public function down(): void
    {
        // The historical source rows have been consolidated into practice_session.
    }
};
