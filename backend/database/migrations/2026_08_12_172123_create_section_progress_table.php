<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->uuid('section_id');

            $table->timestamp('started_at')->nullable();

            $table->unsignedTinyInteger('progress_percentage')
                ->default(0);

            $table->unsignedInteger('time_spent')
                ->default(0);

            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->foreign('section_id')
                ->references('id')
                ->on('sections')
                ->cascadeOnDelete();

            $table->unique([
                'user_id',
                'section_id',
            ]);

            $table->index([
                'user_id',
                'completed_at',
            ]);

            $table->index([
                'section_id',
                'completed_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_progress');
    }
};