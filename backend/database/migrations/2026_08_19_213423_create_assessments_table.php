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
        Schema::create('assessments', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->foreignUuid('course_id')
        ->constrained()
        ->cascadeOnDelete();

    $table->string('title');
    $table->string('slug');

    $table->text('description')->nullable();

    $table->unsignedTinyInteger('minimum_score')
        ->default(80);

    $table->unsignedTinyInteger('required_quiz_score')
        ->default(70);

    $table->unsignedInteger('required_scenarios')
        ->default(0);

    $table->unsignedTinyInteger('max_attempts')
        ->nullable();

    $table->boolean('is_required')
        ->default(true);

    $table->string('status')
        ->default('draft');

    $table->timestamp('published_at')->nullable();

    $table->timestamps();

    $table->unique(['course_id', 'slug']);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
