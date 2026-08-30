<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticActionType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class DiagnosticScenarioStep extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_steps';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'position',
        'title',
        'description',
        'action_type',
        'configuration',
        'evidence',
        'is_required',
        'is_terminal',
    ];

    protected function casts(): array
    {
        return [
            'action_type' => DiagnosticActionType::class,
            'position' => 'integer',
            'configuration' => 'array',
            'evidence' => 'array',
            'is_required' => 'boolean',
            'is_terminal' => 'boolean',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }

    public function scoringCriteria(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioScoringCriterion::class,
            'step_id'
        )->orderBy('position');
    }
}