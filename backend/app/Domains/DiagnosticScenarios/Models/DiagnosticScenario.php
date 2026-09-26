<?php

namespace App\Domains\DiagnosticScenarios\Models;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Models\Course;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class DiagnosticScenario extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'diagnostic_scenarios';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'course_id',
        'data_pack_id',
        'title',
        'slug',
        'description',
        'customer_complaint',
        'fault_codes',
        'system_tag',
        'position',
        'version',
        'supersedes_id',
        'passing_score',
        'time_limit',
        'max_hints',
        'status',
        'is_required',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DiagnosticScenarioStatus::class,
            'position' => 'integer',
            'passing_score' => 'integer',
            'time_limit' => 'integer',
            'max_hints' => 'integer',
            'fault_codes' => 'array',
            'is_required' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function dataPack(): BelongsTo
    {
        return $this->belongsTo(
            \App\Models\SimulatorDataPack::class,
            'data_pack_id'
        );
    }

    /** Effective hint budget for an attempt. */
    public function hintBudget(): int
    {
        return max(0, $this->max_hints ?? 3);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(
            Course::class,
            'course_id'
        );
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioAttempt::class,
            'diagnostic_scenario_id'
        );
    }

    public function assessments(): BelongsToMany
    {
        return $this->belongsToMany(
            Assessment::class,
            'assessment_diagnostic_scenarios',
            'diagnostic_scenario_id',
            'assessment_id'
        )
            ->withPivot([
                'position',
                'is_required',
            ])
            ->withTimestamps()
            ->orderByPivot('position');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioStep::class,
            'diagnostic_scenario_id'
        )->orderBy('position');
    }

    public function scoringCriteria(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioScoringCriterion::class,
            'diagnostic_scenario_id'
        )->orderBy('position');
    }

    public function hints(): HasMany
    {
        return $this->hasMany(
            DiagnosticScenarioHint::class,
            'diagnostic_scenario_id'
        )->orderBy('position');
    }

    public function courseAssignments(): HasMany
    {
        return $this->hasMany(
            CourseDiagnosticScenario::class,
            'diagnostic_scenario_id'
        );
    }
}