<?php

namespace App\Domains\DiagnosticScenarios\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiagnosticScenarioStepResult extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_step_results';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'diagnostic_scenario_attempt_id',
        'diagnostic_scenario_step_id',
        'points_earned',
        'points_possible',
        'is_correct',
        'criteria_breakdown',
        'graded_at',
    ];

    protected function casts(): array
    {
        return [
            'points_earned' => 'integer',
            'points_possible' => 'integer',
            'is_correct' => 'boolean',
            'criteria_breakdown' => 'array',
            'graded_at' => 'datetime',
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
}
