<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnostic_scenarios', function (Blueprint $table) {
            // Scenario definition version. A student who starts version N
            // finishes against version N (attempts pin scenario_version).
            $table->unsignedInteger('version')->default(1)->after('slug');

            // Self-referential chain: this version supersedes a prior scenario row.
            $table->foreignUuid('supersedes_id')
                ->nullable()
                ->after('version')
                ->constrained('diagnostic_scenarios')
                ->nullOnDelete();
        });

        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            // Pinned scenario version for scoring/certificate integrity.
            $table->unsignedInteger('scenario_version')->default(1)->after('attempt_number');
        });
    }

    public function down(): void
    {
        Schema::table('diagnostic_scenario_attempts', function (Blueprint $table) {
            $table->dropColumn('scenario_version');
        });

        Schema::table('diagnostic_scenarios', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supersedes_id');
            $table->dropColumn(['version']);
        });
    }
};
