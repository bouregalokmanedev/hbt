<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('diagnostic_scenarios', function (Blueprint $table) {
            $table->text('customer_complaint')->nullable()->after('description');
            $table->json('fault_codes')->nullable()->after('customer_complaint');
            $table->unsignedTinyInteger('max_hints')->default(3)->after('time_limit');
            $table->string('system_tag')->nullable()->after('max_hints');
        });

        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->string('tool')->nullable()->after('action_type');
            $table->unsignedInteger('duration_seconds')->nullable()->after('evidence');
            $table->string('discipline')->nullable()->after('duration_seconds');
        });
    }

    public function down(): void
    {
        Schema::table('diagnostic_scenarios', function (Blueprint $table) {
            $table->dropColumn(['customer_complaint', 'fault_codes', 'max_hints', 'system_tag']);
        });

        Schema::table('diagnostic_scenario_steps', function (Blueprint $table) {
            $table->dropColumn(['tool', 'duration_seconds', 'discipline']);
        });
    }
};
