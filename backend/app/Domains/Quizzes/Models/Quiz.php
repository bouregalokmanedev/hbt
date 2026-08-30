<?php

namespace App\Domains\Quizzes\Models;

use App\Domains\Quizzes\Enums\QuizStatus;
use App\Models\Section;
use Database\Factories\Domains\Quizzes\QuizFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Assessments\Models\Assessment;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Quiz extends Model
{
    use HasFactory;
     use HasUuids;

    protected $table = 'quizzes';

    protected $fillable = [
        'section_id',
        'title',
        'slug',
        'description',
        'position',
        'status',
        'pass_percentage',
        'max_attempts',
        'time_limit',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuizStatus::class,
            'pass_percentage' => 'integer',
            'max_attempts' => 'integer',
            'time_limit' => 'integer',
        ];
    }

    protected static function newFactory(): QuizFactory
    {
        return QuizFactory::new();
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(
            Section::class,
            'section_id'
        );
    }

    public function questions(): HasMany
    {
        return $this->hasMany(
            QuizQuestion::class,
            'quiz_id'
        )->orderBy('position');
    }
    public function attempts(): HasMany
{
    return $this->hasMany(
        QuizAttempt::class,
        'quiz_id'
    );
}
public function assessments(): BelongsToMany
{
    return $this->belongsToMany(
        Assessment::class,
        'assessment_quizzes',
        'quiz_id',
        'assessment_id'
    )
        ->withPivot([
            'position',
            'is_required',
        ])
        ->withTimestamps()
        ->orderByPivot('position');
}
}