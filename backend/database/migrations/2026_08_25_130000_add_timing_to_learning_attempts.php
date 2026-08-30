<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('timed_out_at')->nullable();
        });
        Schema::table('assessment_attempts', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamp('timed_out_at')->nullable();
        });
    }
    public function down(): void
    {
        Schema::table('quiz_attempts', fn (Blueprint $table) => $table->dropColumn(['expires_at', 'timed_out_at']));
        Schema::table('assessment_attempts', fn (Blueprint $table) => $table->dropColumn(['expires_at', 'timed_out_at']));
    }
};
