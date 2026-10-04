<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('instructor_progression_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('total_xp')->default(0);
            $table->unsignedSmallInteger('level')->default(1);
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->timestamps();
        });

        Schema::create('instructor_xp_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('event');
            $table->unsignedInteger('xp');
            $table->string('dedupe_key');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('instructor_xp_transactions');
        Schema::dropIfExists('instructor_progression_profiles');
    }
};
