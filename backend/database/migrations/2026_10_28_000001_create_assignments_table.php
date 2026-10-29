<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('course_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('title');
            $table->string('slug');
            $table->text('instructions');

            $table->unsignedSmallInteger('max_points')
                ->default(100);

            $table->boolean('allow_late_submissions')
                ->default(true);

            $table->timestamp('due_at')
                ->nullable();

            $table->string('status')
                ->default('draft');

            $table->timestamp('published_at')
                ->nullable();

            $table->timestamps();

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

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
