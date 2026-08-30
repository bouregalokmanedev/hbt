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
    Schema::create('student_settings', function (Blueprint $table) {
        $table->id();

        $table->foreignId('user_id')
            ->unique()
            ->constrained('users')
            ->cascadeOnDelete();

        $table->string('language', 5)
            ->default('en');

        $table->string('timezone', 64)
            ->default('Africa/Algiers');

        $table->string('appearance', 20)
            ->default('system');

        $table->boolean('compact_mode')
            ->default(false);

        $table->boolean('reduced_motion')
            ->default(false);

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
   public function down(): void
{
    Schema::dropIfExists('student_settings');
}
};
