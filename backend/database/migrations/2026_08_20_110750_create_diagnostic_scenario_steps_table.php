<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->unsignedInteger('position');

            $table->string('title');

            $table->text('description')->nullable();

            /*
             * What the student is expected to do.
             *
             * Examples:
             * inspect
             * scan
             * measure
             * test
             * diagnose
             */
            $table->string('action_type');

            /*
             * Flexible configuration for the step.
             *
             * Example:
             * {
             *   "component": "fuel_pressure",
             *   "unit": "bar",
             *   "expected_range": {
             *      "min": 3.5,
             *      "max": 4.0
             *   }
             * }
             */
            $table->json('configuration')->nullable();

            /*
             * Evidence/information presented to the student
             * when the step becomes available.
             */
            $table->json('evidence')->nullable();

            $table->boolean('is_required')
                ->default(true);

            $table->boolean('is_terminal')
                ->default(false);

            $table->timestamps();

            $table->unique([
                'scenario_id',
                'position',
            ]);

            $table->index([
                'scenario_id',
                'is_required',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenario_steps');
    }
};