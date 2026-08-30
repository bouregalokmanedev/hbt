<?php

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnostic_scenario_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('scenario_id')
                ->constrained('diagnostic_scenarios')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedInteger('attempt_number');

            $table->unsignedTinyInteger('score')
                ->nullable();

            $table->boolean('passed')
                ->default(false);

            $table->string('status')
                ->default(
                    DiagnosticScenarioAttemptStatus::IN_PROGRESS->value
                );

            $table->json('evidence')
                ->nullable();

            $table->timestamp('started_at')
                ->nullable();

            $table->timestamp('submitted_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'scenario_id',
                'user_id',
                'attempt_number',
            ]);

            $table->index([
                'scenario_id',
                'user_id',
            ]);

            $table->index([
                'user_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnostic_scenario_attempts');
    }
};