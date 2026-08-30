<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignUuid('step_id')
                ->nullable()
                ->constrained('diagnostic_scenario_steps')
                ->nullOnDelete();

            $table->string('key');

            $table->string('title');

            $table->text('description')->nullable();

            /*
             * Maximum points available for this criterion.
             */
            $table->unsignedInteger('points');

            /*
             * How the criterion should eventually be evaluated.
             *
             * Examples:
             * exact_match
             * range
             * contains
             * boolean
             * manual
             */
            $table->string('evaluation_type');

            /*
             * Flexible expected value/rules.
             */
            $table->json('rules')->nullable();

            $table->boolean('is_required')
                ->default(true);

            $table->unsignedInteger('position')
                ->default(1);

            $table->timestamps();

            $table->unique([
                'scenario_id',
                'key',
            ]);

            $table->unique([
                'scenario_id',
                'position',
            ]);

            $table->index([
                'scenario_id',
                'step_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'diagnostic_scenario_scoring_criteria'
        );
    }
};