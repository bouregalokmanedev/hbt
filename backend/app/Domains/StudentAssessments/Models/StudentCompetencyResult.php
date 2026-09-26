<?php

namespace App\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-competency breakdown within a result.
 * Table: student_competency_results
 */
final class StudentCompetencyResult extends Model
{
    use HasUuids;

    protected $table = 'student_competency_results';

    protected $fillable = [
        'attempt_id',
        'result_id',
        'competency_id',
        'competency_name',
        'score',
        'percentage',
        'proficiency_level',
        'confidence',
        'evidence_count',
        'strength_level',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'decimal:2',
            'percentage' => 'decimal:2',
            'proficiency_level' => ProficiencyLevel::class,
            'evidence_count' => 'integer',
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
