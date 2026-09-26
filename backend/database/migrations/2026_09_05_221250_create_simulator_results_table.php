<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simulator_results', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('session_id');

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('tool');
            $table->string('scenario_key')->nullable();

            $table->unsignedSmallInteger('score')->nullable();

            $table->string('outcome')->nullable();
            $table->string('verdict')->nullable();

            $table->unsignedInteger('attempts')->default(1);
            $table->unsignedInteger('hints_used')->default(0);

            $table->unsignedInteger('duration_seconds')->nullable();

            $table->json('steps')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->foreign('session_id')
                ->references('id')
                ->on('simulator_sessions')
                ->cascadeOnDelete();

            $table->index(['user_id', 'tool']);
            $table->index(['scenario_key']);
            $table->index(['session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simulator_results');
    }
};