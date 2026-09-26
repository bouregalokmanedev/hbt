<?php

namespace App\Domains\StudentAssessments\Models;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks the path a student takes through a diagnostic scenario.
 * Table: student_assessment_scenario_paths
 */
final class StudentAssessmentScenarioPath extends Model
{
    use HasUuids;

    protected $table = 'student_assessment_scenario_paths';

    protected $fillable = [
        'attempt_id',
        'scenario_id',
        'step_id',
        'chosen_option',
        'next_step_id',
        'order',
        'points_earned',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'chosen_option' => 'array',
            'points_earned' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentAttempt::class, 'attempt_id');
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\DiagnosticScenarios\Models\DiagnosticScenario::class, 'scenario_id');
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(DiagnosticScenarioStep::class, 'step_id');
    }

    public function nextStep(): BelongsTo
    {
        return $this->belongsTo(DiagnosticScenarioStep::class, 'next_step_id');
    }
}