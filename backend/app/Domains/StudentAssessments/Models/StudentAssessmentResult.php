<?php

namespace App\Domains\StudentAssessments\Models;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\StudentAssessments\Enums\AssessmentResultStatus;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Comprehensive student result with multi-dimensional scores.
 * Table: student_assessment_results
 */
final class StudentAssessmentResult extends Model
{
    use HasUuids;

    protected $table = 'student_assessment_results';

    protected $fillable = [
        'attempt_id',
        'student_id',
        'assessment_id',
        'score',
        'percentage',
        'passed',
        'proficiency_level',
        'knowledge_score',
        'application_score',
        'decision_score',
        'problem_solving_score',
        'confidence_score',
        'time_efficiency_score',
        'started_at',
        'completed_at',
        'result_status',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'percentage' => 'decimal:2',
            'passed' => 'boolean',
            'proficiency_level' => ProficiencyLevel::class,
            'knowledge_score' => 'decimal:2',
            'application_score' => 'decimal:2',
            'decision_score' => 'decimal:2',
            'problem_solving_score' => 'decimal:2',
            'confidence_score' => 'decimal:2',
            'time_efficiency_score' => 'decimal:2',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'result_status' => AssessmentResultStatus::class,
            'generated_at' => 'datetime',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentAttempt::class, 'attempt_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class, 'assessment_id');
    }

    public function competencyResults(): HasMany
    {
        return $this->hasMany(StudentCompetencyResult::class, 'result_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(StudentAssessmentEvidence::class, 'result_id');
    }
}
