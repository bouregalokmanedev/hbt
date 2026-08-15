<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->uuid('course_id');

            $table->timestamp('started_at')->nullable();

            $table->unsignedTinyInteger('progress_percentage')
                ->default(0);

            $table->unsignedInteger('time_spent')
                ->default(0);

            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->foreign('course_id')
                ->references('id')
                ->on('courses')
                ->cascadeOnDelete();

            $table->unique([
                'user_id',
                'course_id',
            ]);

            $table->index([
                'user_id',
                'completed_at',
            ]);

            $table->index([
                'course_id',
                'completed_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_progress');
    }
};