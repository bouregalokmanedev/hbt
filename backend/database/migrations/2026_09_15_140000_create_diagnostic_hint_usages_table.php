<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_hint_usages', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('diagnostic_scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_attempt_id')
                ->constrained('diagnostic_scenario_attempts')
                ->cascadeOnDelete();

            $table->foreignUuid('diagnostic_scenario_hint_id')
                ->constrained('diagnostic_scenario_hints')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('penalty_applied')->default(0);

            $table->timestamp('used_at')->nullable();

            $table->timestamps();

            // One use per hint per attempt (progressive disclosure, no farming).
            $table->unique(
                ['diagnostic_scenario_attempt_id', 'diagnostic_scenario_hint_id'],
                'dhu_attempt_hint_unique'
            );

            $table->index('diagnostic_scenario_attempt_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_hint_usages');
    }
};
