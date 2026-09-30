<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardTheme extends Model
{
    /** The free theme every student owns; also the fallback when none is chosen (lowest sort_order). */
    public const DEFAULT_SLUG = 'default';

    protected $fillable = [
        'slug', 'name', 'description', 'points_cost', 'preview_image_path',
        'config', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_active' => 'boolean',
            'points_cost' => 'integer',
            'sort_order' => 'integer',
        ];
    }
}
