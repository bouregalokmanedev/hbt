<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            // Canonical correct answer per question type:
            // short_answer: {accepted: [string], case_sensitive: bool}
            // numeric: {value: float, tolerance: float}
            // ordering: {ordered_option_ids: [uuid]}
            // matching: {pairs: {left: right}}
            $table->json('answer_key')->nullable()->after('required');
            $table->json('scoring_config')->nullable()->after('answer_key');
        });
    }

    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn(['answer_key', 'scoring_config']);
        });
    }
};
