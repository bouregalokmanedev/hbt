<?php

namespace App\Domains\Assessments\Models;

use App\Domains\Quizzes\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Database\Factories\Domains\Assessments\Models\AssessmentQuestionFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssessmentQuestion extends Model
{
    use HasFactory;

    protected $table = 'assessment_questions';

    protected $fillable = [
        'assessment_id',
        'quiz_question_id',
        'position',
        'points',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'points' => 'integer',
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(
            Assessment::class,
            'assessment_id'
        );
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(
            QuizQuestion::class,
            'quiz_question_id'
        );
    }

    protected static function newFactory()
    {
        return AssessmentQuestionFactory::new();
    }
}