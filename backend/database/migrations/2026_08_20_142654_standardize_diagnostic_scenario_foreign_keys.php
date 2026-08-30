<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasColumn('diagnostic_scenario_steps', 'scenario_id') &&
            ! Schema::hasColumn('diagnostic_scenario_steps', 'diagnostic_scenario_id')
        ) {
            Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
                $table->renameColumn(
                    'scenario_id',
                    'diagnostic_scenario_id'
                );
            });
        }

        if (
            Schema::hasColumn('diagnostic_scenario_scoring_criteria', 'scenario_id') &&
            ! Schema::hasColumn(
                'diagnostic_scenario_scoring_criteria',
                'diagnostic_scenario_id'
            )
        ) {
            Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
                $table->renameColumn(
                    'scenario_id',
                    'diagnostic_scenario_id'
                );
            });
        }

        if (
            Schema::hasColumn('diagnostic_scenario_attempts', 'scenario_id') &&
            ! Schema::hasColumn(
                'diagnostic_scenario_attempts',
                'diagnostic_scenario_id'
            )
        ) {
            Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
                $table->renameColumn(
                    'scenario_id',
                    'diagnostic_scenario_id'
                );
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasColumn('diagnostic_scenario_steps', 'diagnostic_scenario_id') &&
            ! Schema::hasColumn('diagnostic_scenario_steps', 'scenario_id')
        ) {
            Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
                $table->renameColumn(
                    'diagnostic_scenario_id',
                    'scenario_id'
                );
            });
        }

        if (
            Schema::hasColumn(
                'diagnostic_scenario_scoring_criteria',
                'diagnostic_scenario_id'
            ) &&
            ! Schema::hasColumn(
                'diagnostic_scenario_scoring_criteria',
                'scenario_id'
            )
        ) {
            Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
                $table->renameColumn(
                    'diagnostic_scenario_id',
                    'scenario_id'
                );
            });
        }

        if (
            Schema::hasColumn(
                'diagnostic_scenario_attempts',
                'diagnostic_scenario_id'
            ) &&
            ! Schema::hasColumn(
                'diagnostic_scenario_attempts',
                'scenario_id'
            )
        ) {
            Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
                $table->renameColumn(
                    'diagnostic_scenario_id',
                    'scenario_id'
                );
            });
        }
    }
};