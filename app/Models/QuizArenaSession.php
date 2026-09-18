<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QuizArenaSession extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'user_id', 'level_id', 'weekend_date', 'question_ids', 'status',
        'total_questions', 'correct_answers', 'total_time_seconds',
        'rank', 'points_awarded', 'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'weekend_date' => 'date:Y-m-d',
            'question_ids' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(fn (QuizArenaSession $session) => $session->uuid ??= (string) Str::uuid());
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attempts()
    {
        return $this->hasMany(QuizArenaAttempt::class, 'session_id');
    }
}
