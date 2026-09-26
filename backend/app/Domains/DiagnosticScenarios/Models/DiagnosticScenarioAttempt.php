<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class DiagnosticScenarioAttempt extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenario_attempts';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'diagnostic_scenario_id',
        'user_id',
        'attempt_number',
        'scenario_version',
        'score',
        'passed',
        'status',
        'evidence',
        'started_at',
        'submitted_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'score' => 'integer',
            'passed' => 'boolean',
            'status' => DiagnosticScenarioAttemptStatus::class,
            'evidence' => 'array',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(
            DiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function responses(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioResponse::class,
            'diagnostic_scenario_attempt_id'
        );
    }

    public function stepResults(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioStepResult::class,
            'diagnostic_scenario_attempt_id'
        );
    }

    public function result(): HasOne
    {
        return $this->hasOne(
            DiagnosticScenarioResult::class,
            'diagnostic_scenario_attempt_id'
        );
    }

    public function hintUsages(): HasMany
    {
        return $this->hasMany(
            DiagnosticHintUsage::class,
            'diagnostic_scenario_attempt_id'
        );
    }

    public function hintPenaltyTotal(): int
    {
        return (int) $this->hintUsages()->sum('penalty_applied');
    }
}