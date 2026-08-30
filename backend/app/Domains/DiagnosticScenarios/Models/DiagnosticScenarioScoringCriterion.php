<?php

namespace App\Domains\DiagnosticScenarios\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiagnosticScenarioScoringCriterion extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_scoring_criteria';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'step_id',
        'key',
        'title',
        'description',
        'points',
        'evaluation_type',
        'rules',
        'is_required',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'points' => 'integer',
            'rules' => 'array',
            'is_required' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }

    public function step(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenarioStep::class,
            'step_id'
        );
    }
}