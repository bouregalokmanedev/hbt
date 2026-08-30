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
       Schema::table('student_learning_preferences', function (Blueprint $table) {
    $table->string('learning_pace', 30)
        ->default('adaptive');

    $table->string('preferred_content_format', 30)
        ->default('video');

    $table->boolean('autoplay')
        ->default(true);

    $table->boolean('subtitles_enabled')
        ->default(true);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_learning_preferences', function (Blueprint $table) {
            //
        });
    }
};
