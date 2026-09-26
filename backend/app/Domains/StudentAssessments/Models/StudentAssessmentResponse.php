<?php

namespace App\Domains\StudentAssessments\Models;

use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\StudentAssessments\Enums\ConfidenceLevel;
use App\Domains\StudentAssessments\Enums\ResponseStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Student response per question within an attempt.
 * Table: student_assessment_responses
 */
final class StudentAssessmentResponse extends Model
{
    use HasUuids;
    use HasFactory;

    protected $table = 'student_assessment_responses';

    protected $fillable = [
        'attempt_id',
        'question_id',
        'response_type',
        'answer',
        'answer_metadata',
        'started_at',
        'answered_at',
        'time_spent_seconds',
        'confidence_level',
        'is_flagged',
        'status',
        'points_awarded',
        'is_correct',
        'evaluation_status',
        'feedback',
    ];

    protected function casts(): array
    {
        return [
            'answer' => 'array',
            'answer_metadata' => 'array',
            'started_at' => 'datetime',
            'answered_at' => 'datetime',
            'time_spent_seconds' => 'integer',
            'confidence_level' => ConfidenceLevel::class,
            'is_flagged' => 'boolean',
            'status' => ResponseStatus::class,
            'points_awarded' => 'integer',
            'is_correct' => 'boolean',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentAttempt::class, 'attempt_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class, 'question_id');
    }
}
