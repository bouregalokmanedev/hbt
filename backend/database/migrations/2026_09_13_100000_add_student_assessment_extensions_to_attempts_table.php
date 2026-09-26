<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('assessment_attempts', function (Blueprint $table) {
            $table->timestamp('last_activity_at')->nullable()->after('started_at');
            $table->uuid('current_section_id')->nullable()->after('expires_at');
            $table->uuid('current_question_id')->nullable()->after('current_section_id');
            $table->unsignedTinyInteger('progress_percentage')->default(0)->after('current_question_id');
            $table->unsignedInteger('time_spent_seconds')->default(0)->after('progress_percentage');
            $table->string('proficiency_level')->nullable()->after('passed');
        });

        Schema::table('assessment_attempt_answers', function (Blueprint $table) {
            $table->timestamp('started_at')->nullable()->after('points_earned');
            $table->timestamp('answered_at')->nullable()->after('started_at');
            $table->unsignedInteger('time_spent_seconds')->default(0)->after('answered_at');
            $table->string('confidence_level')->nullable()->after('time_spent_seconds');
            $table->boolean('is_flagged')->default(false)->after('confidence_level');
            $table->string('status')->default('answered')->after('is_flagged');
            $table->string('response_type')->default('multiple_choice')->after('status');
            $table->string('evaluation_status')->default('pending')->after('is_correct');
            $table->text('feedback')->nullable()->after('evaluation_status');
            $table->json('answer')->nullable()->after('feedback');
            $table->json('answer_metadata')->nullable()->after('answer');
        });
    }

    public function down(): void
    {
        Schema::table('assessment_attempts', function (Blueprint $table) {
            $table->dropColumn(['last_activity_at', 'current_section_id', 'current_question_id', 'progress_percentage', 'time_spent_seconds', 'proficiency_level']);
        });
        Schema::table('assessment_attempt_answers', function (Blueprint $table) {
            $table->dropColumn(['started_at', 'answered_at', 'time_spent_seconds', 'confidence_level', 'is_flagged', 'status', 'response_type', 'evaluation_status', 'feedback', 'answer', 'answer_metadata']);
        });
    }
};
