<?php

namespace App\Domains\Assignments\Models;

use App\Domains\Assignments\Enums\AssignmentSubmissionStatus;
use App\Models\User;
use Database\Factories\Domains\Assignments\Models\AssignmentSubmissionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AssignmentSubmission extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'assignment_id',
        'user_id',
        'content',
        'link_url',
        'status',
        'grade',
        'feedback',
        'submitted_at',
        'graded_at',
        'graded_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssignmentSubmissionStatus::class,
            'grade' => 'decimal:2',
            'submitted_at' => 'datetime',
            'graded_at' => 'datetime',
        ];
    }

    protected static function newFactory(): AssignmentSubmissionFactory
    {
        return AssignmentSubmissionFactory::new();
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function isGraded(): bool
    {
        return $this->status === AssignmentSubmissionStatus::GRADED;
    }
}
