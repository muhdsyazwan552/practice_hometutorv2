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
        if (Schema::hasTable('question_reports')) {
            DB::table('question_reports')
                ->where('context', 'mission_practice')
                ->update(['context' => 'mission_subtopic']);
        }

        if (! Schema::hasTable('practice_session') || ! Schema::hasTable('mastery_challenge_sessions')) {
            return;
        }

        if (! Schema::hasColumn('mastery_challenge_sessions', 'mission_scope')) {
            Schema::table('mastery_challenge_sessions', function (Blueprint $table): void {
                $table->string('mission_scope', 20)->default('subject')->index();
            });
        }

        // Older subtopic missions were stored under the misleading practice type.
        DB::table('mastery_challenge_sessions')
            ->where('session_type', 'practice')
            ->where('total_questions', '>', 5)
            ->update(['session_type' => 'mission', 'mission_scope' => 'subtopic']);

        DB::table('practice_session')
            ->where('session_type', 'practice')
            ->where('total_questions', '>', 5)
            ->whereNotNull('mastery_session_id')
            ->update(['session_type' => 'mission']);

        if (! Schema::hasTable('mastery_challenge_attempts') || ! Schema::hasTable('quiz_attempts') || ! Schema::hasTable('topics')) {
            return;
        }

        DB::table('mastery_challenge_sessions')
            ->where('session_type', 'mission')
            ->orderBy('id')
            ->chunkById(100, function ($sessions): void {
                foreach ($sessions as $session) {
                    $attempts = DB::table('mastery_challenge_attempts')
                        ->where('session_id', $session->id)
                        ->orderBy('id')
                        ->get();
                    if ($attempts->isEmpty()) {
                        continue;
                    }

                    $topic = DB::table('topics')->find($attempts->first()->topic_id);
                    if (! $topic) {
                        continue;
                    }

                    $subtopicId = (int) ($topic->parent_id ?? 0) > 0 ? (int) $topic->id : null;
                    $topicId = $subtopicId ? (int) $topic->parent_id : (int) $topic->id;
                    $total = (int) $session->total_questions;
                    $correct = $attempts->where('is_correct', 1)->count();
                    $row = [
                        'user_id' => $session->user_id,
                        'subject_id' => $session->subject_id,
                        'topic_id' => $topicId,
                        'subtopic_id' => $subtopicId,
                        'question_type_id' => 1,
                        'session_type' => 'mission',
                        'total_questions' => $total,
                        'start_at' => $session->started_at,
                        'end_at' => $session->completed_at ?? $session->updated_at,
                        'total_correct' => $correct,
                        'total_skipped' => max(0, $total - $attempts->count()),
                        'score' => $total > 0 ? round($correct * 100 / $total, 2) : 0,
                        'total_time_seconds' => $session->total_time_seconds,
                        'updated_at' => $session->updated_at,
                    ];

                    DB::transaction(function () use ($session, $attempts, $row, $topicId, $subtopicId): void {
                        $existing = DB::table('practice_session')
                            ->where('mastery_session_id', $session->id)
                            ->first();

                        if ($existing) {
                            DB::table('practice_session')->where('id', $existing->id)->update($row);
                            $reportSessionId = $existing->id;
                        } else {
                            $reportSessionId = DB::table('practice_session')->insertGetId($row + [
                                'uuid' => (string) Str::uuid(),
                                'mastery_session_id' => $session->id,
                                'created_at' => $session->created_at,
                            ]);
                        }

                        if (DB::table('quiz_attempts')->where('session_id', $reportSessionId)->exists()) {
                            return;
                        }

                        $questionParents = DB::table('questions')
                            ->whereIn('id', $attempts->pluck('question_id'))
                            ->pluck('parent_id', 'id');
                        DB::table('quiz_attempts')->insert($attempts->map(fn ($attempt) => [
                            'user_id' => $session->user_id,
                            'parent_id' => $questionParents[$attempt->question_id] ?? 0,
                            'question_id' => $attempt->question_id,
                            'topic_id' => $topicId,
                            'subtopic_id' => $subtopicId,
                            'choosen_answer_id' => $attempt->choosen_answer_id,
                            'answer_status' => $attempt->is_correct,
                            'subjective_answer' => null,
                            'session_id' => $reportSessionId,
                            'time_taken' => $attempt->time_taken_seconds,
                            'question_type_id' => 1,
                            'created_at' => $attempt->created_at,
                            'updated_at' => $attempt->created_at,
                        ])->all());
                    });
                }
            });
    }

    public function down(): void
    {
        // Historical reports are preserved when rolling back this data migration.
    }
};
