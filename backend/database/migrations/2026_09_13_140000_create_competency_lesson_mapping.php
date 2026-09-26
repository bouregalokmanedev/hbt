<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('competency_lesson', function (Blueprint $table) {
            $table->uuid('competency_id');
            $table->foreignUuid('lesson_id')->constrained()->cascadeOnDelete();
            $table->foreign('competency_id')->references('id')->on('competencies')->cascadeOnDelete();
            $table->unsignedInteger('relevance_score')->default(100); // How strongly this lesson teaches the competency
            $table->string('coverage_type')->default('primary'); // primary, reinforcement, assessment
            $table->timestamps();
            $table->primary(['competency_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competency_lesson');
    }
};