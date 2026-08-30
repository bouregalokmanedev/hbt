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
    Schema::create('student_privacy_settings', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')
            ->unique()
            ->constrained('users')
            ->cascadeOnDelete();

        $table->string('profile_visibility', 30)
            ->default('private');

        $table->boolean('show_learning_activity')->default(false);
        $table->boolean('show_achievements')->default(true);
        $table->boolean('show_certificates')->default(true);
        $table->boolean('show_course_progress')->default(false);

        $table->boolean('allow_personalized_recommendations')
            ->default(true);

        $table->boolean('allow_analytics')
            ->default(true);

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('student_privacy_settings');
}
};
