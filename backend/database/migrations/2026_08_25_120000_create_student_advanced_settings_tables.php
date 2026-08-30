<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_security_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('two_factor_method', 20)->nullable();
            $table->timestamp('two_factor_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('student_assessment_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('show_timer')->default(true);
            $table->boolean('confirm_before_submit')->default(true);
            $table->boolean('show_result_breakdown')->default(true);
            $table->boolean('email_result_notifications')->default(true);
            $table->timestamps();
        });

        Schema::create('student_account_deletions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index()->constrained('users')->cascadeOnDelete();
            $table->string('reason', 80);
            $table->text('other_reason')->nullable();
            $table->timestamp('requested_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_account_deletions');
        Schema::dropIfExists('student_assessment_preferences');
        Schema::dropIfExists('student_security_settings');
    }
};
