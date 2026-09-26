<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('interval', 20)->default('month');
            $table->unsignedInteger('trial_days')->default(0);
            $table->json('features')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->string('provider', 50)->default('manual');
            $table->string('provider_ref', 255)->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('transactions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->nullable()->references('id')->on('courses')->nullOnDelete();
            $table->foreignUuid('subscription_id')->nullable()->references('id')->on('subscriptions')->nullOnDelete();
            $table->string('type', 20)->default('purchase');
            $table->string('status', 20)->default('pending');
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('provider', 50)->default('manual');
            $table->string('provider_ref', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('purchases', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->references('id')->on('courses')->cascadeOnDelete();
            $table->foreignUuid('transaction_id')->nullable()->references('id')->on('transactions')->nullOnDelete();
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('status', 20)->default('pending');
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('refunds', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('transaction_id')->references('id')->on('transactions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('reason', 1000)->nullable();
            $table->string('status', 20)->default('pending');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('payouts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('period', 20)->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('note')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['instructor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
    }
};
