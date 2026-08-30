<?php

namespace App\Domains\Assessments\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

final class AssessmentResult extends Model
{
    use HasUuids;
    use HasFactory;

    protected $fillable = [
        'assessment_id',
        'assessment_attempt_id',
        'user_id',
        'score',
        'passed',
        'attempt_number',
        'completed_at',
        'evidence',
        'results',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'passed' => 'boolean',
            'completed_at' => 'datetime',
            'evidence' => 'array',
            'results' => 'array',
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(
            AssessmentAttempt::class,
            'assessment_attempt_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}