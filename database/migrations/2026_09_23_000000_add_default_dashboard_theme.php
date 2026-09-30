<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // The free Default theme every student owns (see User::availableDashboardThemes).
    // sort_order 0 makes it the fallback for students who have not picked a theme.
    public function up(): void
    {
        // The theme tables were created outside this repo's migrations (tests build their own).
        if (! Schema::hasTable('dashboard_themes') || DB::table('dashboard_themes')->where('slug', 'default')->exists()) {
            return;
        }

        DB::table('dashboard_themes')->insert([
            'slug' => 'default',
            'name' => 'Default',
            'description' => 'A clean, modern look with soft gradient colours and no animation.',
            'points_cost' => 0,
            'preview_image_path' => null,
            'config' => json_encode([
                'mode' => 'light',
                'tier' => 'Default',
                'animation' => 'none',
                'tier_description' => 'Modern gradient colours',
            ]),
            'sort_order' => 0,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        $theme = Schema::hasTable('dashboard_themes')
            ? DB::table('dashboard_themes')->where('slug', 'default')->first()
            : null;

        if (! $theme) {
            return;
        }

        DB::table('users')->where('active_dashboard_theme_id', $theme->id)->update(['active_dashboard_theme_id' => null]);
        DB::table('users')->where('learning_space_card_theme_id', $theme->id)->update(['learning_space_card_theme_id' => null]);
        DB::table('dashboard_themes')->where('id', $theme->id)->delete();
    }
};
