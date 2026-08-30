<?php

namespace App\Domains\Quizzes\Models;

use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Models\User;
use Database\Factories\Domains\Quizzes\QuizAttemptFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;

class QuizAttempt extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'quiz_attempts';

    protected $fillable = [
        'quiz_id',
        'user_id',
        'attempt_number',
        'status',
        'score',
        'total_points',
        'percentage',
        'passed',
        'started_at',
        'submitted_at',
        'expires_at',
        'timed_out_at',
        'tab_switch_count',
        'blocked_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuizAttemptStatus::class,
            'score' => 'integer',
            'total_points' => 'integer',
            'percentage' => 'integer',
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'expires_at' => 'datetime',
            'timed_out_at' => 'datetime',
            'blocked_at' => 'datetime',
        ];
    }

    protected static function newFactory(): QuizAttemptFactory
    {
        return QuizAttemptFactory::new();
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(
            Quiz::class,
            'quiz_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }
    public function answers(): HasMany
{
    return $this->hasMany(
        QuizAttemptAnswer::class,
        'attempt_id'
    );
}
}
