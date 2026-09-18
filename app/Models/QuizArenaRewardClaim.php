<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizArenaRewardClaim extends Model
{
    protected $fillable = ['user_id', 'quiz_arena_reward_id', 'points_cost', 'claimed_at', 'metadata'];

    protected function casts(): array
    {
        return [
            'claimed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reward()
    {
        return $this->belongsTo(QuizArenaReward::class, 'quiz_arena_reward_id');
    }
}
