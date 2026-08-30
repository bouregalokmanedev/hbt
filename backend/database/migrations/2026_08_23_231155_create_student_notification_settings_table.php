<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('student_notification_settings', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')
            ->unique()
            ->constrained('users')
            ->cascadeOnDelete();

        $table->boolean('email_enabled')->default(true);
        $table->boolean('push_enabled')->default(true);
        $table->boolean('in_app_enabled')->default(true);

        $table->boolean('course_updates')->default(true);
        $table->boolean('lesson_reminders')->default(true);
        $table->boolean('quiz_reminders')->default(true);
        $table->boolean('assessment_results')->default(true);
        $table->boolean('certificate_issued')->default(true);
        $table->boolean('achievement_unlocked')->default(true);
        $table->boolean('course_completion')->default(true);
        $table->boolean('security_alerts')->default(true);
        $table->boolean('marketing')->default(false);

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('student_notification_settings');
}
};
