<?php

namespace App\Support;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MissionReport
{
    /** Mission rows in the shared learning-session table. */
    public static function sessionsForUser(int $userId): Collection
    {
        if (! Schema::hasTable('practice_session')) {
            return collect();
        }

        $query = DB::table('practice_session as ps')
            ->where('ps.user_id', $userId)
            ->where('ps.session_type', 'mission')
            ->select('ps.*');

        if (Schema::hasColumn('practice_session', 'status') && Schema::hasTable('quiz_attempts')) {
            $query->where(fn ($sessions) => $sessions
                ->where('ps.status', '!=', 'in_progress')
                ->orWhereExists(fn ($attempts) => $attempts->selectRaw('1')
                    ->from('quiz_attempts as qa')->whereColumn('qa.session_id', 'ps.id')));
        }

        if (Schema::hasTable('subject')) {
            $query->leftJoin('subject as s', 's.id', '=', 'ps.subject_id')
                ->addSelect('s.name as subject_name', 's.level_id');
            if (Schema::hasTable('level')) {
                $query->leftJoin('level as l', 'l.id', '=', 's.level_id')
                    ->addSelect('l.name as form_name');
            }
        }

        if (Schema::hasTable('topics')) {
            $query->leftJoin('topics as topic', 'topic.id', '=', 'ps.topic_id')
                ->leftJoin('topics as subtopic', 'subtopic.id', '=', 'ps.subtopic_id')
                ->selectRaw("COALESCE(subtopic.name, topic.name, 'Unknown topic') as topic_name");
        }

        return $query->orderByDesc('ps.created_at')->get();
    }
}
