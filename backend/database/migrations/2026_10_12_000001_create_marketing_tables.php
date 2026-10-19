<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('code', 40)->unique()->nullable();
            $table->text('description')->nullable();
            $table->enum('type', ['percent', 'fixed'])->default('percent');
            $table->unsignedInteger('value')->default(0);
            $table->string('currency', 3)->nullable();
            $table->enum('applies_to', ['all', 'courses', 'plans'])->default('all');
            $table->json('course_ids')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->boolean('active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['active', 'ends_at']);
        });

        Schema::create('featured_courses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('course_id')->constrained('courses')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->string('badge_label', 60)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('featured_courses');
        Schema::dropIfExists('discounts');
    }
};
