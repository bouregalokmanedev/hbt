<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_categories', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name', 100)->unique();
            $table->string('slug', 100)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('risks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->foreignUuid('category_id')->nullable()->constrained('risk_categories')->nullOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('status', 30)->default('open');
            $table->string('level', 20)->default('medium');
            $table->unsignedTinyInteger('probability')->default(3);
            $table->unsignedTinyInteger('impact')->default(3);
            $table->unsignedTinyInteger('score')->default(9);
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('next_review_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'level']);
            $table->index(['owner_id']);
        });

        Schema::create('risk_assessments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('risk_id')->constrained('risks')->cascadeOnDelete();
            $table->foreignId('assessor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('probability');
            $table->unsignedTinyInteger('impact');
            $table->unsignedTinyInteger('score');
            $table->string('level', 20);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('risk_treatments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('risk_id')->constrained('risks')->cascadeOnDelete();
            $table->string('treatment', 30);
            $table->text('description')->nullable();
            $table->string('status', 30)->default('planned');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('due_at')->nullable();
            $table->timestamps();
        });

        Schema::create('risk_controls', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('risk_id')->constrained('risks')->cascadeOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('control_type', 50)->default('preventive');
            $table->string('status', 30)->default('active');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('effectiveness_score')->nullable();
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamp('next_test_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_controls');
        Schema::dropIfExists('risk_treatments');
        Schema::dropIfExists('risk_assessments');
        Schema::dropIfExists('risks');
        Schema::dropIfExists('risk_categories');
    }
};
