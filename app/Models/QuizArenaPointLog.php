<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizArenaPointLog extends Model
{
    protected $fillable = [
        'user_id', 'points', 'type', 'event_key', 'description',
        'week_start', 'reference_type', 'reference_id', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'week_start' => 'date:Y-m-d',
            'metadata' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
