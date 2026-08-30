<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * diagnostic_scenario_steps
         */
        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->dropForeign([
                'scenario_id',
            ]);
        });

        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->renameColumn(
                'scenario_id',
                'diagnostic_scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->foreign('diagnostic_scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();
        });

        /*
         * diagnostic_scenario_scoring_criteria
         */
        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->dropForeign([
                'scenario_id',
            ]);
        });

        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->renameColumn(
                'scenario_id',
                'diagnostic_scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->foreign('diagnostic_scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        /*
         * diagnostic_scenario_steps
         */
        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->dropForeign([
                'diagnostic_scenario_id',
            ]);
        });

        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->renameColumn(
                'diagnostic_scenario_id',
                'scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->foreign('scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();
        });

        /*
         * diagnostic_scenario_scoring_criteria
         */
        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->dropForeign([
                'diagnostic_scenario_id',
            ]);
        });

        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->renameColumn(
                'diagnostic_scenario_id',
                'scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->foreign('scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();
        });
    }
};