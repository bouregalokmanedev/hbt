<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            // null = an autosaved draft that has not been graded yet.
            // Grading runs once, on submit.
            $table->boolean('is_correct')->nullable()->change();
            $table->unsignedInteger('points_earned')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_attempt_answers', function (Blueprint $table) {
            $table->boolean('is_correct')->default(false)->change();
            $table->unsignedInteger('points_earned')->default(0)->change();
        });
    }
};
