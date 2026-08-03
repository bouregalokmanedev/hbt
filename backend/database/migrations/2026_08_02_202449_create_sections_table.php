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
        Schema::create('sections', function (Blueprint $table) {
    $table->uuid('id')->primary();

$table->uuid('course_id');

$table->string('title')->nullable();
$table->string('slug')->nullable();

$table->text('description')->nullable();

$table->unsignedInteger('position');

$table->string('status')->default('draft');

    $table->timestamps();

    $table->foreign('course_id')
        ->references('id')
        ->on('courses')
        ->cascadeOnDelete();

    $table->unique([
        'course_id',
        'position',
    ]);

    $table->unique([
        'course_id',
        'slug',
    ]);

    $table->index([
        'course_id',
        'status',
    ]);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};
