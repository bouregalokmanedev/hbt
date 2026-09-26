<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event_type', 80)->index();
            $table->string('severity', 20)->default('info');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_id', 100)->nullable();
            $table->string('session_id', 100)->nullable();
            $table->string('target_type', 150)->nullable();
            $table->string('target_id', 100)->nullable();
            $table->boolean('success')->nullable();
            $table->string('failure_reason', 255)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['event_type', 'occurred_at']);
            $table->index(['user_id', 'occurred_at']);
        });

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'tenant_id')) {
                $table->uuid('tenant_id')->nullable()->after('id')->index();
            }
        });

        Schema::table('courses', function (Blueprint $table): void {
            if (! Schema::hasColumn('courses', 'tenant_id')) {
                $table->uuid('tenant_id')->nullable()->after('id')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_events');
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'tenant_id')) {
                $table->dropColumn('tenant_id');
            }
        });
        Schema::table('courses', function (Blueprint $table): void {
            if (Schema::hasColumn('courses', 'tenant_id')) {
                $table->dropColumn('tenant_id');
            }
        });
    }
};
