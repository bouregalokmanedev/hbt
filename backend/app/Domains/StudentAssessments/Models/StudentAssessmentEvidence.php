<?php

namespace App\Domains\StudentAssessments\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Evidence linking attempt/question/competency.
 * Table: student_assessment_evidence
 */
final class StudentAssessmentEvidence extends Model
{
    use HasUuids;

    protected $table = 'student_assessment_evidence';

    protected $fillable = [
        'attempt_id',
        'result_id',
        'question_id',
        'competency_id',
        'evidence_type',
        'response',
        'expected_behavior',
        'observed_behavior',
        'points',
        'quality_score',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'response' => 'array',
            'metadata' => 'array',
            'points' => 'integer',
            'quality_score' => 'decimal:2',
        ];
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentAttempt::class, 'attempt_id');
    }

    public function result(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentResult::class, 'result_id');
    }
}
