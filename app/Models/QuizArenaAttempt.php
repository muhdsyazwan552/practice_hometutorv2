<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizArenaAttempt extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id', 'user_id', 'question_id', 'subject_id', 'topic_id',
        'chosen_answer_id', 'is_correct', 'time_taken_seconds', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function session()
    {
        return $this->belongsTo(QuizArenaSession::class, 'session_id');
    }
}
