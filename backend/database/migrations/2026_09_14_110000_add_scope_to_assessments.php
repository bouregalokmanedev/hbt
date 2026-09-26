<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            // Optional curriculum scope:
            // - lesson_id set → formative assessment for one lesson
            // - section_id set (lesson_id null) → section assessment
            // - neither → course assessment (final)
            $table->foreignUuid('section_id')->nullable()->after('course_id')
                ->constrained('sections')->nullOnDelete();
            $table->foreignUuid('lesson_id')->nullable()->after('section_id')
                ->constrained('lessons')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('section_id');
            $table->dropConstrainedForeignId('lesson_id');
        });
    }
};
