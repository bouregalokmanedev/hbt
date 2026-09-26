<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_hints', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('diagnostic_scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_step_id')
                ->nullable()
                ->constrained('diagnostic_scenario_steps')
                ->nullOnDelete();

            // Progressive hint level: 1 = nudge, 2 = guidance, 3 = near-answer.
            $table->unsignedTinyInteger('level')->default(1);

            $table->string('title')->nullable();
            $table->text('content');

            // Score penalty applied when this hint is used.
            $table->unsignedTinyInteger('penalty_points')->default(5);

            $table->unsignedInteger('position')->default(1);

            $table->timestamps();

            $table->index(['diagnostic_scenario_id', 'diagnostic_scenario_step_id']);
            $table->index(['diagnostic_scenario_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenario_hints');
    }
};
