<?php

namespace App\Domains\Assessments\Models;

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
        'title',
        'slug',
        'description',
        'minimum_score',
        'required_quiz_score',
        'required_scenarios',
        'max_attempts',
        'is_required',
        'status',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssessmentStatus::class,
            'is_required' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
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
        ])
        ->withTimestamps()
        ->orderByPivot('position');
}
}