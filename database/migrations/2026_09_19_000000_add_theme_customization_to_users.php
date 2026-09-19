<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Theme Studio choices on top of the unlocked themes: accent, own background colours and a custom learning-space card.
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'theme_customization')) {
            Schema::table('users', function (Blueprint $table) {
                $table->json('theme_customization')->nullable()->after('learning_space_card_theme_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'theme_customization')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('theme_customization');
            });
        }
    }
};
