<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table): void {
            if (! Schema::hasColumn('payment_transactions', 'idempotency_key')) {
                $table->string('idempotency_key', 120)->nullable()->after('payment_id');
                $table->unique('idempotency_key', 'payment_transactions_idempotency_unique');
            }
        });

        Schema::table('invoices', function (Blueprint $table): void {
            if (! Schema::hasColumn('invoices', 'idempotency_key')) {
                $table->string('idempotency_key', 120)->nullable()->after('provider_invoice_id');
                $table->unique('idempotency_key', 'invoices_idempotency_unique');
            }
        });

        Schema::table('webhook_events', function (Blueprint $table): void {
            if (! Schema::hasColumn('webhook_events', 'claimed_at')) {
                $table->timestamp('claimed_at')->nullable()->after('status');
                $table->index(['status', 'claimed_at'], 'webhook_events_status_claim_index');
            }
        });

        Schema::table('orders', function (Blueprint $table): void {
            // Idempotency belongs to the buyer, not the whole platform.
            $table->dropUnique('orders_idempotency_key_unique');
            $table->unique(['user_id', 'idempotency_key'], 'orders_user_idempotency_unique');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique('orders_user_idempotency_unique');
            $table->unique('idempotency_key', 'orders_idempotency_key_unique');
        });

        Schema::table('webhook_events', function (Blueprint $table): void {
            $table->dropIndex('webhook_events_status_claim_index');
            $table->dropColumn('claimed_at');
        });

        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropUnique('invoices_idempotency_unique');
            $table->dropColumn('idempotency_key');
        });

        Schema::table('payment_transactions', function (Blueprint $table): void {
            $table->dropUnique('payment_transactions_idempotency_unique');
            $table->dropColumn('idempotency_key');
        });
    }
};
