<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            // Remove the existing foreign key.
            $table->dropForeign([
                'scenario_id',
            ]);
        });

        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            // Rename the existing column.
            $table->renameColumn(
                'scenario_id',
                'diagnostic_scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            // Recreate the foreign key using the new column name.
            $table->foreign('diagnostic_scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            $table->dropForeign([
                'diagnostic_scenario_id',
            ]);
        });

        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            $table->renameColumn(
                'diagnostic_scenario_id',
                'scenario_id'
            );
        });

        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            $table->foreign('scenario_id')
                ->references('id')
                ->on('diagnostic_scenarios')
                ->cascadeOnDelete();
        });
    }
};