<?php

namespace App\Domains\StudentAssessments\Models;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Student-centric view over assessment_attempts table.
 * Extends attempt with lifecycle fields: progress, timer, navigation.
 *
 * Table: assessment_attempts (shared with Assessments domain)
 */
final class StudentAssessmentAttempt extends Model
{
    use HasUuids;

    protected $table = 'assessment_attempts';

    protected $fillable = [
        'assessment_id',
        'user_id',
        'attempt_number',
        'status',
        'score',
        'passed',
        'started_at',
        'last_activity_at',
        'submitted_at',
        'completed_at',
        'expires_at',
        'timed_out_at',
        'blocked_at',
        'tab_switch_count',
        'current_section_id',
        'current_question_id',
        'progress_percentage',
        'time_spent_seconds',
        'proficiency_level',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
            'timed_out_at' => 'datetime',
            'blocked_at' => 'datetime',
            'progress_percentage' => 'integer',
            'time_spent_seconds' => 'integer',
            'proficiency_level' => ProficiencyLevel::class,
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(AssessmentResult::class, 'assessment_attempt_id');
    }

    public function studentResult(): HasOne
    {
        return $this->hasOne(StudentAssessmentResult::class, 'attempt_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(StudentAssessmentResponse::class, 'attempt_id');
    }

    public function competencyResults(): HasMany
    {
        return $this->hasMany(StudentCompetencyResult::class, 'attempt_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(StudentAssessmentEvidence::class, 'attempt_id');
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(StudentAssessmentRecommendation::class, 'attempt_id');
    }

    public function integrityEvents(): HasMany
    {
        return $this->hasMany(StudentAssessmentIntegrityEvent::class, 'attempt_id');
    }

    public function scenarioPaths(): HasMany
    {
        return $this->hasMany(StudentAssessmentScenarioPath::class, 'attempt_id');
    }

    /** Access underlying AssessmentAttempt model for compatibility */
    public function toAssessmentAttempt(): AssessmentAttempt
    {
        return AssessmentAttempt::find($this->id);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isInProgress(): bool
    {
        return $this->status === 'in_progress' || $this->status?->value === 'in_progress';
    }
}
