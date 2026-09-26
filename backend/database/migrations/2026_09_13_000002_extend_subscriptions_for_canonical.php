<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table): void {
            if (! Schema::hasColumn('subscriptions', 'provider_subscription_id')) {
                $table->string('provider_subscription_id', 255)->nullable()->after('provider');
            }
            if (! Schema::hasColumn('subscriptions', 'provider_customer_id')) {
                $table->string('provider_customer_id', 255)->nullable()->after('provider_subscription_id');
            }
            if (! Schema::hasColumn('subscriptions', 'currency')) {
                $table->string('currency', 10)->default('DZD')->after('provider_customer_id');
            }
            if (! Schema::hasColumn('subscriptions', 'amount')) {
                $table->unsignedBigInteger('amount')->default(0)->after('currency');
            }
            if (! Schema::hasColumn('subscriptions', 'billing_interval')) {
                $table->string('billing_interval', 20)->default('month')->after('amount');
            }
            if (! Schema::hasColumn('subscriptions', 'billing_interval_count')) {
                $table->unsignedInteger('billing_interval_count')->default(1)->after('billing_interval');
            }
            if (! Schema::hasColumn('subscriptions', 'trial_starts_at')) {
                $table->timestamp('trial_starts_at')->nullable()->after('billing_interval_count');
            }
            if (! Schema::hasColumn('subscriptions', 'starts_at')) {
                $table->timestamp('starts_at')->nullable()->after('trial_ends_at');
            }
            if (! Schema::hasColumn('subscriptions', 'current_period_start')) {
                $table->timestamp('current_period_start')->nullable()->after('starts_at');
            }
            if (! Schema::hasColumn('subscriptions', 'cancel_at_period_end')) {
                $table->boolean('cancel_at_period_end')->default(false)->after('cancelled_at');
            }
            if (! Schema::hasColumn('subscriptions', 'ended_at')) {
                $table->timestamp('ended_at')->nullable()->after('cancel_at_period_end');
            }
            if (! Schema::hasColumn('subscriptions', 'metadata')) {
                $table->json('metadata')->nullable()->after('ended_at');
            }
        });

        Schema::create('subscription_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->foreignUuid('subscription_plan_id')->references('id')->on('plans')->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_amount')->default(0);
            $table->string('currency', 10)->default('DZD');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_items');
        Schema::table('subscriptions', function (Blueprint $table): void {
            $columns = ['provider_subscription_id', 'provider_customer_id', 'currency', 'amount', 'billing_interval', 'billing_interval_count', 'trial_starts_at', 'starts_at', 'current_period_start', 'cancel_at_period_end', 'ended_at', 'metadata'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('subscriptions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
