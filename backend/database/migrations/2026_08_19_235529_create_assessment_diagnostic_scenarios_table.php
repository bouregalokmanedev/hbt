<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_diagnostic_scenarios', function (Blueprint $table) {
            $table->uuid('assessment_id');

            $table->uuid('diagnostic_scenario_id');

            $table->unsignedInteger('position');

            $table->boolean('is_required')
                ->default(true);

            $table->timestamps();

            $table->foreign('assessment_id')
                ->references('id')
                ->on('assessments')
                ->cascadeOnDelete();

            $table->foreign('diagnostic_scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->primary([
                'assessment_id',
                'diagnostic_scenario_id',
            ]);

            $table->unique([
                'assessment_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_diagnostic_scenarios');
    }
};