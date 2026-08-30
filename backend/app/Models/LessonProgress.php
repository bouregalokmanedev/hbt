<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class LessonProgress extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
    'user_id',
    'lesson_id',
    'started_at',
    'progress_percentage',
    'time_spent',
    'last_position',
    'video_position',
    'completed_at',
];
protected $appends = [
    'is_completed',
];

public function getIsCompletedAttribute(): bool
{
    return $this->completed_at !== null;
}


    protected function casts(): array
{
    return [
        'started_at' => 'datetime',
        'progress_percentage' => 'integer',
        'time_spent' => 'integer',
        'last_position' => 'integer',
        'video_position' => 'integer',
        'completed_at' => 'datetime',
    ];
}

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}