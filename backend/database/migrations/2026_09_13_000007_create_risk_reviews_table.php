<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_reviews', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('risk_id')->constrained('risks')->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->useCurrent();
            $table->timestamp('next_review_at')->nullable();
            $table->string('outcome', 30)->default('continued');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['risk_id', 'reviewed_at']);
            $table->index(['next_review_at']);
        });

        Schema::create('risk_evidence', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('risk_id')->constrained('risks')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('file_path', 500)->nullable();
            $table->string('evidence_type', 50)->default('document');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risk_evidence');
        Schema::dropIfExists('risk_reviews');
    }
};
