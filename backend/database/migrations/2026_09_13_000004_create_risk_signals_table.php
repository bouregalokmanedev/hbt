<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risk_signals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('type', 50)->index();
            $table->string('severity', 20)->default('medium');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('event_type', 80)->nullable();
            $table->integer('score')->default(0);
            $table->json('context')->nullable();
            $table->string('status', 20)->default('open');
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['type', 'occurred_at']);
        });

        Schema::create('recovery_codes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code_hash', 255);
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'used_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recovery_codes');
        Schema::dropIfExists('risk_signals');
    }
};
