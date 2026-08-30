<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->renameColumn(
                'diagnostic_scenario_id',
                'scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->renameColumn(
                'diagnostic_scenario_id',
                'scenario_id'
            );
        });
    }

    public function down(): void
    {
        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->renameColumn(
                'scenario_id',
                'diagnostic_scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_scoring_criteria', function (Blueprint $table) {
            $table->renameColumn(
                'scenario_id',
                'diagnostic_scenario_id'
            );
        });
    }
};