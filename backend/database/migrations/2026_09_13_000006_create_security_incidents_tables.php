<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_incidents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable()->index();
            $table->string('incident_number', 20)->unique();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('type', 50)->default('security');
            $table->string('severity', 20)->default('medium');
            $table->string('status', 30)->default('open');
            $table->timestamp('detected_at')->useCurrent();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('contained_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source_type', 100)->nullable();
            $table->string('source_id', 100)->nullable();
            $table->text('impact')->nullable();
            $table->text('root_cause')->nullable();
            $table->text('resolution')->nullable();
            $table->text('lessons_learned')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'severity']);
            $table->index(['assigned_to', 'status']);
        });

        Schema::create('incident_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('security_incident_id')->constrained('security_incidents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event', 80);
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incident_events');
        Schema::dropIfExists('security_incidents');
    }
};
