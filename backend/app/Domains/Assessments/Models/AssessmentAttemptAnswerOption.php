<?php

namespace App\Domains\Assessments\Models;

use App\Domains\Quizzes\Models\QuizQuestionOption;
use Database\Factories\Domains\Assessments\Models\AssessmentAttemptAnswerOptionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssessmentAttemptAnswerOption extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'assessment_attempt_answer_options';

    protected $fillable = [
        'answer_id',
        'option_id',
    ];

    protected static function newFactory(): AssessmentAttemptAnswerOptionFactory
    {
        return AssessmentAttemptAnswerOptionFactory::new();
    }

    public function answer(): BelongsTo
    {
        return $this->belongsTo(
            AssessmentAttemptAnswer::class,
            'answer_id'
        );
    }

    public function option(): BelongsTo
    {
        return $this->belongsTo(
            QuizQuestionOption::class,
            'option_id'
        );
    }
}