<?php

namespace App\Domains\Students\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentLearningPreference extends Model
{
    protected $fillable = [
    'user_id',

    'learning_pace',
    'preferred_content_format',
    'autoplay',
    'subtitles_enabled',

    'preferred_content_language',
    'difficulty_preference',
    'autoplay_lessons',
    'resume_last_position',
    'show_completed_lessons',
    'show_quiz_explanations',
    'confirm_before_quiz_submit',
    'daily_learning_goal_minutes',
    'weekly_learning_goal_minutes',
    'preferred_learning_days',
    'preferred_learning_start_time',
    'preferred_learning_end_time',
];

    protected function casts(): array
{
    return [
        'autoplay' => 'boolean',
        'subtitles_enabled' => 'boolean',

        'autoplay_lessons' => 'boolean',
        'resume_last_position' => 'boolean',
        'show_completed_lessons' => 'boolean',
        'show_quiz_explanations' => 'boolean',
        'confirm_before_quiz_submit' => 'boolean',

        'preferred_learning_days' => 'array',
    ];
}

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}