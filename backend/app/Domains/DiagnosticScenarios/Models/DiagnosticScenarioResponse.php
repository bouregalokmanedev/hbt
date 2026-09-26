<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiagnosticScenarioResponse extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_responses';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'diagnostic_scenario_attempt_id',
        'diagnostic_scenario_step_id',
        'user_id',
        'response_number',
        'tool',
        'payload',
        'points_earned',
        'points_possible',
        'is_correct',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'tool' => DiagnosticTool::class,
            'response_number' => 'integer',
            'payload' => 'array',
            'points_earned' => 'integer',
            'points_possible' => 'integer',
            'is_correct' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenarioAttempt::class,
            'diagnostic_scenario_attempt_id'
        );
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenarioStep::class,
            'diagnostic_scenario_step_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
