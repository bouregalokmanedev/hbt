<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table): void {
            $table->id();

            // Nullable: funnel events are also captured for logged-out visitors.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('event', 64);
            $table->string('page', 191)->nullable();
            $table->json('properties')->nullable();
            $table->string('session_hash', 64)->nullable();

            $table->timestamps();

            $table->index(['event', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
