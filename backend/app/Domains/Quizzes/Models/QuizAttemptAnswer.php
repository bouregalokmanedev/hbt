<?php

namespace App\Domains\Quizzes\Models;

use Database\Factories\Domains\Quizzes\QuizAttemptAnswerFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class QuizAttemptAnswer extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'quiz_attempt_answers';

    protected $fillable = [
        'attempt_id',
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

    protected static function newFactory(): QuizAttemptAnswerFactory
    {
        return QuizAttemptAnswerFactory::new();
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(
            QuizAttempt::class,
            'attempt_id'
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
            QuizAttemptAnswerOption::class,
            'answer_id'
        );
    }
}