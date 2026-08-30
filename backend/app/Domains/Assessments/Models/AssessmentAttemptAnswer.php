<?php

namespace App\Domains\Assessments\Models;

use App\Domains\Quizzes\Models\QuizQuestion;
use Database\Factories\Domains\Assessments\Models\AssessmentAttemptAnswerFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class AssessmentAttemptAnswer extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'assessment_attempt_answers';

    protected $fillable = [
        'assessment_attempt_id',
        'question_id',
        'is_correct',
        'points_earned',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'points_earned' => 'integer',
        ];
    }

    protected static function newFactory(): AssessmentAttemptAnswerFactory
    {
        return AssessmentAttemptAnswerFactory::new();
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(
            AssessmentAttempt::class,
            'assessment_attempt_id'
        );
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(
            QuizQuestion::class,
            'question_id'
        );
    }

    public function selectedOptions(): HasMany
    {
        return $this->hasMany(
            AssessmentAttemptAnswerOption::class,
            'answer_id'
        );
    }
}