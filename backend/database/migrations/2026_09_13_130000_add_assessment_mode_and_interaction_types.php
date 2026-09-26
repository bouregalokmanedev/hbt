<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->string('assessment_mode')->default('summative')->after('status');
            $table->json('interaction_types')->nullable()->after('assessment_mode'); // knowledge, scenario, case_study, problem_solving, practical_task, reflection
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn(['assessment_mode', 'interaction_types']);
        });
    }
};