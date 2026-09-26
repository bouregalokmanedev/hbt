<?php

namespace App\Domains\StudentAssessments\Models;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Recommendation linking weak competency to learning content.
 * Table: student_assessment_recommendations
 */
final class StudentAssessmentRecommendation extends Model
{
    use HasUuids;

    protected $table = 'student_assessment_recommendations';

    protected $fillable = [
        'student_id',
        'attempt_id',
        'assessment_result_id',
        'competency_id',
        'competency_name',
        'course_id',
        'section_id',
        'lesson_id',
        'recommendation_type',
        'title',
        'description',
        'priority',
        'reason',
        'status',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(StudentAssessmentAttempt::class, 'attempt_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
