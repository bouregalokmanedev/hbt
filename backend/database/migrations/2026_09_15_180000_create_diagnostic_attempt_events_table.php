<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_attempt_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('diagnostic_scenario_attempt_id')->constrained('diagnostic_scenario_attempts', 'id', 'dae_attempt_fk')->cascadeOnDelete();
            $table->foreignUuid('diagnostic_scenario_id')->constrained('diagnostic_scenarios')->cascadeOnDelete();
            $table->unsignedBigInteger('sequence');
            $table->string('event_type', 40); // scenario_loaded|tool_opened|probe_connected|measurement_taken|trace_step|hint_used|step_completed|completed
            $table->unsignedInteger('sim_time_ms')->default(0);
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();
            $table->unique(['diagnostic_scenario_attempt_id', 'sequence'], 'dae_attempt_seq_uq');
            $table->index(['diagnostic_scenario_id', 'event_type'], 'dae_scenario_event_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_attempt_events');
    }
};
