<?php

namespace App\Domains\Assessments\Models;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class Competency extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
    ];

    protected function casts(): array
    {
        return [
            'code' => 'string',
            'name' => 'string',
            'description' => 'string',
            'category' => 'string',
        ];
    }

    public function assessments(): BelongsToMany
    {
        return $this->belongsToMany(
            Assessment::class,
            'assessment_competencies',
            'competency_id',
            'assessment_id'
        )->withPivot(['position', 'weight']);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(
            \App\Domains\Quizzes\Models\QuizQuestion::class,
            'assessment_questions',
            'competency_id',
            'quiz_question_id'
        )->withPivot(['position', 'points']);
    }

    public function lessons(): BelongsToMany
    {
        return $this->belongsToMany(
            Lesson::class,
            'competency_lesson',
            'competency_id',
            'lesson_id'
        )->withPivot(['relevance_score', 'coverage_type'])
        ->orderByPivot('relevance_score', 'desc');
    }

    public function primaryLessons(): BelongsToMany
    {
        return $this->lessons()->wherePivot('coverage_type', 'primary');
    }
}