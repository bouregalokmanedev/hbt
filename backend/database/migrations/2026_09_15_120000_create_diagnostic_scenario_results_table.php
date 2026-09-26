<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_results', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('diagnostic_scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_attempt_id')
                ->constrained('diagnostic_scenario_attempts', 'id', 'dsres_attempt_fk')
                ->cascadeOnDelete()
                ->unique('dsres_attempt_uq');

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Overall score 0-100. Server-authoritative, never trusted from frontend.
            $table->unsignedTinyInteger('score')->default(0);

            // Dimension breakdowns (0-100 each, nullable until computed).
            $table->unsignedTinyInteger('accuracy')->nullable();
            $table->unsignedTinyInteger('process_score')->nullable();

            $table->unsignedInteger('points_earned')->default(0);
            $table->unsignedInteger('points_possible')->default(0);

            $table->boolean('passed')->default(false);

            // Strength / weakness labels derived from criteria, e.g. ["Electrical testing"].
            $table->json('strengths')->nullable();
            $table->json('weaknesses')->nullable();

            // Full per-step detail for the result screen + audit.
            $table->json('breakdown')->nullable();

            $table->timestamp('generated_at')->nullable();

            $table->timestamps();

            $table->index(['diagnostic_scenario_id', 'user_id']);
            $table->index(['user_id', 'passed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenario_results');
    }
};
