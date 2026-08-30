<?php

namespace App\Models;

use App\Domains\Assessments\Models\AssessmentResult;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;


final class Certificate extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

   protected $fillable = [
    'enrollment_id',
    'assessment_result_id',
    'course_id',
    'user_id',
    'certificate_number',
    'recipient_name',
    'course_title',
    'issued_at',
];

    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Certificate $certificate): void {
            $certificate->certificate_number ??= 'HBT-'.Str::upper(
                Str::random(14)
            );
        });
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(
            Enrollment::class
        );
    }

   public function assessmentResult(): BelongsTo
{
    return $this->belongsTo(
        AssessmentResult::class,
        'assessment_result_id'
    );
}

    public function course(): BelongsTo
    {
        return $this->belongsTo(
            Course::class
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class
        );
    }
}