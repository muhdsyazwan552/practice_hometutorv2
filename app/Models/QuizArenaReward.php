<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizArenaReward extends Model
{
    public const TYPE_VOUCHER = 'voucher';

    public const TYPE_THEME = 'theme';

    public const TYPE_BADGE = 'badge';

    protected $fillable = [
        'title', 'description', 'type', 'points_cost', 'icon', 'theme_slug', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'points_cost' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function claims()
    {
        return $this->hasMany(QuizArenaRewardClaim::class);
    }
}
