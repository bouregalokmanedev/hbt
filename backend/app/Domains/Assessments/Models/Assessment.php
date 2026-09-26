<?php

namespace App\Domains\Assessments\Models;

use App\Domains\Assessments\Enums\AssessmentMode;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Models\Course;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;

final class Assessment extends Model
{
    use HasUuids;
    use HasFactory;

    protected $fillable = [
        'course_id',
        'section_id',
        'lesson_id',
        'title',
        'slug',
        'description',
        'minimum_score',
        'required_quiz_score',
        'required_scenarios',
        'max_attempts',
        'is_required',
        'status',
        'assessment_mode',
        'interaction_types',
        'proficiency_thresholds',
        'adaptive_config',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssessmentStatus::class,
            'is_required' => 'boolean',
            'assessment_mode' => AssessmentMode::class,
            'interaction_types' => 'array',
            'proficiency_thresholds' => 'array',
            'adaptive_config' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Section::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Lesson::class);
    }

    public function competencies(): BelongsToMany
    {
        return $this->belongsToMany(
            Competency::class,
            'assessment_competencies',
            'assessment_id',
            'competency_id'
        )
            ->withPivot(['position', 'weight'])
            ->withTimestamps()
            ->orderByPivot('position');
    }

    public function scope(): string
    {
        if ($this->lesson_id !== null) {
            return 'lesson';
        }

        if ($this->section_id !== null) {
            return 'section';
        }

        return 'course';
    }

    public function isAdaptive(): bool
    {
        $types = $this->interaction_types ?? [];

        return in_array('adaptive', $types, true)
            && ! empty($this->adaptive_config);
    }

    public function adaptiveConfig(): array
    {
        return array_merge(
            ['min_questions' => 5, 'max_questions' => 20, 'target_se' => 0.3],
            $this->adaptive_config ?? [],
        );
    }

    public function getProficiencyThresholds(): ?array
    {
        return $this->proficiency_thresholds;
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(AssessmentAttempt::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(AssessmentResult::class);
    }
    public function diagnosticScenarios(): BelongsToMany
{
    return $this->belongsToMany(
        DiagnosticScenario::class,
        'assessment_diagnostic_scenarios',
        'assessment_id',
        'diagnostic_scenario_id'
    )
        ->withPivot([
            'position',
            'is_required',
        ])
        ->withTimestamps()
        ->orderByPivot('position');
}
public function quizzes(): BelongsToMany
{
    return $this->belongsToMany(
        Quiz::class,
        'assessment_quizzes',
        'assessment_id',
        'quiz_id'
    )
        ->withPivot([
            'position',
            'is_required',
        ])
        ->withTimestamps()
        ->orderByPivot('position');
}
public function questions(): BelongsToMany
{
    return $this->belongsToMany(
        QuizQuestion::class,
        'assessment_questions',
        'assessment_id',
        'quiz_question_id'
    )
        ->withPivot([
            'position',
            'points',
            'competency_id',
        ])
        ->withTimestamps()
        ->orderByPivot('position');
}
}