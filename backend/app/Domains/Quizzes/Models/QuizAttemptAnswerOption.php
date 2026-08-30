<?php

namespace App\Domains\Quizzes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class QuizAttemptAnswerOption extends Model
{
    use HasUuids;

    protected $table = 'quiz_attempt_answer_options';

    protected $fillable = [
        'answer_id',
        'option_id',
    ];

    public function answer(): BelongsTo
    {
        return $this->belongsTo(
            QuizAttemptAnswer::class,
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