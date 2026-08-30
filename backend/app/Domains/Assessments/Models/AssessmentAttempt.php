<?php

namespace App\Domains\Assessments\Models;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use Illuminate\Database\Eloquent\Relations\HasMany;


final class AssessmentAttempt extends Model
{
    use HasUuids;
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'user_id',
        'attempt_number',
        'status',
        'score',
        'passed',
        'started_at',
        'submitted_at',
        'completed_at',
        'expires_at',
        'timed_out_at',
        'tab_switch_count',
        'blocked_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssessmentAttemptStatus::class,
            'score' => 'decimal:2',
            'passed' => 'boolean',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
            'timed_out_at' => 'datetime',
            'blocked_at' => 'datetime',
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(AssessmentResult::class);
    }
    public function answers(): HasMany
{
    return $this->hasMany(
        AssessmentAttemptAnswer::class,
        'assessment_attempt_id'
    );
}
}
