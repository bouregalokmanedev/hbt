<?php

namespace App\Domains\Quizzes\Models;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use Database\Factories\Domains\Quizzes\QuizQuestionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Domains\Assessments\Models\Assessment;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class QuizQuestion extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'quiz_questions';

    protected $fillable = [
        'quiz_id',
        'question',
        'type',
        'position',
        'points',
        'required',
    ];

    protected function casts(): array
    {
        return [
            'type' => QuizQuestionType::class,
            'points' => 'integer',
            'required' => 'boolean',
        ];
    }

    protected static function newFactory(): QuizQuestionFactory
    {
        return QuizQuestionFactory::new();
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(
            Quiz::class,
            'quiz_id'
        );
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuizQuestionOption::class)
            ->orderBy('position');
    }
    public function assessments(): BelongsToMany
{
    return $this->belongsToMany(
        Assessment::class,
        'assessment_questions',
        'quiz_question_id',
        'assessment_id'
    )
        ->withPivot([
            'position',
            'points',
        ])
        ->withTimestamps()
        ->orderByPivot('position');
}
}
