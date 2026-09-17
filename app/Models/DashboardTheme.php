<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardTheme extends Model
{
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
