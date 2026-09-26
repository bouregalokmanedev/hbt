<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            // CAT configuration, e.g. {algorithm, min_questions, max_questions, target_se}.
            // Null = CAT disabled even if listed in interaction_types.
            $table->json('adaptive_config')->nullable()->after('proficiency_thresholds');
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn('adaptive_config');
        });
    }
};
