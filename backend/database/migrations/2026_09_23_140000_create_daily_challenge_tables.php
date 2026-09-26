<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_challenge_defs', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            // lesson_complete | section_complete | quiz_complete | diagnostic_complete | simulator_complete
            $table->string('action')->index();
            $table->string('route')->nullable();
            $table->unsignedInteger('xp')->default(10);
            $table->unsignedInteger('target')->default(1);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort')->default(0);
            $table->json('payload')->nullable();
            $table->timestamps();
        });

        Schema::create('daily_challenge_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('daily_challenge_def_id')->constrained('daily_challenge_defs')->cascadeOnDelete();
            $table->date('date');
            $table->string('status')->default('pending'); // pending | in_progress | completed | claimed
            $table->unsignedInteger('progress')->default(0);
            $table->unsignedInteger('target')->default(1);
            $table->unsignedInteger('xp_awarded')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->json('detail')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'daily_challenge_def_id', 'date'], 'daily_challenge_user_def_date');
            $table->index(['user_id', 'date']);
            $table->index(['date', 'completed_at']);
        });

        Schema::create('daily_challenge_rivals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenger_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('challenged_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('status')->default('pending'); // pending | accepted | declined
            $table->json('result')->nullable(); // shared snapshot when viewed after both finish
            $table->timestamps();
            $table->unique(['challenger_id', 'challenged_id', 'date'], 'daily_rival_unique');
            $table->index(['challenged_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_challenge_rivals');
        Schema::dropIfExists('daily_challenge_assignments');
        Schema::dropIfExists('daily_challenge_defs');
    }
};
