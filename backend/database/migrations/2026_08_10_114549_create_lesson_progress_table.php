<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lesson_progress', function (Blueprint $table) {
    $table->uuid('id')->primary();

    $table->foreignId('user_id')
        ->constrained('users')
        ->cascadeOnDelete();

    $table->uuid('lesson_id');

    $table->timestamp('started_at')->nullable();

    $table->unsignedTinyInteger('progress_percentage')
        ->default(0);

    $table->unsignedInteger('time_spent')
        ->default(0);

    $table->unsignedInteger('last_position')
        ->nullable();

    $table->unsignedInteger('video_position')
        ->nullable();

    $table->timestamp('completed_at')->nullable();

    $table->timestamps();

            $table->foreign('lesson_id')
                ->references('id')
                ->on('lessons')
                ->cascadeOnDelete();

            $table->unique([
                'user_id',
                'lesson_id',
            ]);

            $table->index([
                'user_id',
                'completed_at',
            ]);

            $table->index([
                'lesson_id',
                'completed_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
    }
};