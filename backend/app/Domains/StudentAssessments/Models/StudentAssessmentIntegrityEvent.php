<?php

namespace App\Domains\StudentAssessments\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Integrity / audit events per attempt (tab switch, device change, etc.)
 * Table: student_assessment_integrity_events
 */
final class StudentAssessmentIntegrityEvent extends Model
{
    use HasUuids;

    protected $table = 'student_assessment_integrity_events';

    protected $fillable = [
        'attempt_id',
        'event_type',
        'occurred_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentAttempt::class, 'attempt_id');
    }
}
