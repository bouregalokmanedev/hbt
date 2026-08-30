<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('student_progression_profiles', function (Blueprint $table): void {
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            $table->date('last_activity_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('student_progression_profiles', function (Blueprint $table): void {
            $table->dropColumn(['current_streak', 'longest_streak', 'last_activity_date']);
        });
    }
};
