<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extend existing plans table to canonical subscription_plans shape (additive, non-breaking)
        Schema::table('plans', function (Blueprint $table): void {
            if (! Schema::hasColumn('plans', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('active');
            }
            if (! Schema::hasColumn('plans', 'deleted_at')) {
                $table->softDeletes()->after('updated_at');
            }
            if (! Schema::hasColumn('plans', 'stripe_product_id')) {
                $table->string('stripe_product_id', 100)->nullable()->after('sort_order');
            }
            if (! Schema::hasColumn('plans', 'stripe_price_id')) {
                $table->string('stripe_price_id', 100)->nullable()->after('stripe_product_id');
            }
            if (! Schema::hasColumn('plans', 'paypal_product_id')) {
                $table->string('paypal_product_id', 100)->nullable()->after('stripe_price_id');
            }
            if (! Schema::hasColumn('plans', 'paypal_plan_id')) {
                $table->string('paypal_plan_id', 100)->nullable()->after('paypal_product_id');
            }
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('currency', 10)->default('DZD');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->string('status', 20)->default('pending');
            $table->string('payment_type', 20)->default('one_time');
            $table->string('provider', 50)->default('stripe');
            $table->string('provider_order_id', 255)->nullable();
            $table->string('idempotency_key', 80)->unique();
            $table->timestamp('placed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['provider', 'provider_order_id']);
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('purchasable_type', 100);
            $table->uuid('purchasable_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_price')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['purchasable_type', 'purchasable_id']);
        });

        Schema::create('payments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 50)->default('stripe');
            $table->string('provider_payment_id', 255)->nullable();
            $table->string('provider_customer_id', 255)->nullable();
            $table->string('payment_method_type', 30)->default('card');
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('status', 30)->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->string('failure_code', 100)->nullable();
            $table->text('failure_message')->nullable();
            $table->string('idempotency_key', 80)->unique();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['provider', 'provider_payment_id']);
            $table->unique(['provider', 'provider_payment_id'], 'payments_provider_pid_unique');
        });

        Schema::create('payment_transactions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('type', 30)->default('sale');
            $table->string('provider_transaction_id', 255)->nullable();
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->string('status', 30)->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['payment_id', 'type']);
        });

        Schema::create('payment_methods', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 50)->default('stripe');
            $table->string('provider_payment_method_id', 255);
            $table->string('type', 30)->default('card');
            $table->string('brand', 30)->nullable();
            $table->string('last_four', 4)->nullable();
            $table->unsignedTinyInteger('exp_month')->nullable();
            $table->unsignedSmallInteger('exp_year')->nullable();
            $table->boolean('is_default')->default(false);
            $table->string('billing_name', 150)->nullable();
            $table->string('billing_country', 10)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'provider', 'provider_payment_method_id'], 'pm_user_provider_unique');
            $table->index(['user_id', 'is_default']);
        });

        Schema::create('webhook_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('provider', 50);
            $table->string('event_id', 255);
            $table->string('event_type', 100);
            $table->json('payload');
            $table->string('status', 20)->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'event_id'], 'webhooks_provider_event_unique');
            $table->index(['provider', 'status']);
        });

        Schema::create('invoices', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('subscription_id')->nullable()->references('id')->on('subscriptions')->nullOnDelete();
            $table->foreignUuid('order_id')->nullable()->references('id')->on('orders')->nullOnDelete();
            $table->string('provider', 50)->default('stripe');
            $table->string('provider_invoice_id', 255)->nullable();
            $table->string('number', 50)->nullable()->unique();
            $table->string('currency', 10)->default('DZD');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->string('status', 20)->default('draft');
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['subscription_id', 'status']);
        });

        Schema::create('subscription_features', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('key', 80)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('type', 30)->default('boolean');
            $table->timestamps();
        });

        Schema::create('subscription_plan_features', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('subscription_plan_id')->references('id')->on('plans')->cascadeOnDelete();
            $table->foreignUuid('subscription_feature_id')->references('id')->on('subscription_features')->cascadeOnDelete();
            $table->string('value', 255);
            $table->timestamps();

            $table->unique(['subscription_plan_id', 'subscription_feature_id'], 'plan_feature_unique');
        });

        Schema::create('payment_provider_plans', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('subscription_plan_id')->references('id')->on('plans')->cascadeOnDelete();
            $table->string('provider', 50);
            $table->string('external_product_id', 255)->nullable();
            $table->string('external_plan_id', 255)->nullable();
            $table->string('external_price_id', 255)->nullable();
            $table->string('currency', 10)->default('DZD');
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('status', 20)->default('active');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['subscription_plan_id', 'provider'], 'provider_plan_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_provider_plans');
        Schema::dropIfExists('subscription_plan_features');
        Schema::dropIfExists('subscription_features');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('webhook_events');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');

        Schema::table('plans', function (Blueprint $table): void {
            if (Schema::hasColumn('plans', 'sort_order')) {
                $table->dropColumn('sort_order');
            }
            if (Schema::hasColumn('plans', 'stripe_product_id')) {
                $table->dropColumn(['stripe_product_id', 'stripe_price_id', 'paypal_product_id', 'paypal_plan_id']);
            }
            if (Schema::hasColumn('plans', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
