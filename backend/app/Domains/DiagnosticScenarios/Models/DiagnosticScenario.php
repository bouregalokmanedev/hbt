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
        'title',
        'slug',
        'description',
        'position',
        'passing_score',
        'time_limit',
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
            'is_required' => 'boolean',
            'published_at' => 'datetime',
        ];
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
}