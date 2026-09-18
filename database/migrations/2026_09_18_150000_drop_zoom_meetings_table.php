<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('zoom_meetings');
    }

    public function down(): void
    {
        // Zoom Meeting SDK integration removed — not recreated.
    }
};
