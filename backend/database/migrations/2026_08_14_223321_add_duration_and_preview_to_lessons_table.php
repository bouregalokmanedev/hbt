<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->unsignedInteger('duration_minutes')
                ->nullable()
                ->after('position');

            $table->boolean('is_preview')
                ->default(false)
                ->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn([
                'duration_minutes',
                'is_preview',
            ]);
        });
    }
};