<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_course', function (Blueprint $table) {

    $table->uuid('category_id');

    $table->uuid('course_id');

    $table->timestamps();

    $table->foreign('category_id')
        ->references('id')
        ->on('categories')
        ->cascadeOnDelete();

    $table->foreign('course_id')
        ->references('id')
        ->on('courses')
        ->cascadeOnDelete();

    $table->unique([
        'category_id',
        'course_id',
    ]);
});
    }

    public function down(): void
    {
        Schema::dropIfExists('category_course');
    }
};