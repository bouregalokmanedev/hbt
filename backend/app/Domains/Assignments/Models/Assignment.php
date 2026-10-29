<?php

namespace App\Domains\Assignments\Models;

use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Models\Course;
use Database\Factories\Domains\Assignments\Models\AssignmentFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Assignment extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'course_id',
        'title',
        'slug',
        'instructions',
        'max_points',
        'allow_late_submissions',
        'due_at',
        'status',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'max_points' => 'integer',
            'allow_late_submissions' => 'boolean',
            'due_at' => 'datetime',
            'status' => AssignmentStatus::class,
            'published_at' => 'datetime',
        ];
    }

    protected static function newFactory(): AssignmentFactory
    {
        return AssignmentFactory::new();
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    public function isPublished(): bool
    {
        return $this->status === AssignmentStatus::PUBLISHED;
    }

    public function isPastDue(): bool
    {
        return $this->due_at !== null
            && $this->due_at->isPast();
    }
}
