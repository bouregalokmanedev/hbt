<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulator_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('vehicle_key');
            $table->string('tool');
            $table->string('scenario_key')->nullable();

            $table->string('status')->default('active');

            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();

            $table->unsignedInteger('duration_seconds')->nullable();

            $table->unsignedSmallInteger('score')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['vehicle_key', 'tool']);
            $table->index(['scenario_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulator_sessions');
    }
};