<?php

namespace App\Domains\DiagnosticScenarios\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class DiagnosticScenarioHint extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_hints';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'diagnostic_scenario_step_id',
        'level',
        'title',
        'content',
        'penalty_points',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'penalty_points' => 'integer',
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
            'diagnostic_scenario_step_id'
        );
    }

    public function usages(): HasMany
    {
        return $this->hasMany(
            DiagnosticHintUsage::class,
            'diagnostic_scenario_hint_id'
        );
    }
}
