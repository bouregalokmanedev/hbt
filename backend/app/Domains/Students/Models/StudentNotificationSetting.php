<?php

namespace App\Domains\Students\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentNotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'email_enabled',
        'push_enabled',
        'in_app_enabled',
        'course_updates',
        'lesson_reminders',
        'quiz_reminders',
        'assessment_results',
        'certificate_issued',
        'achievement_unlocked',
        'course_completion',
        'security_alerts',
        'marketing',
    ];

    protected function casts(): array
    {
        return [
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'in_app_enabled' => 'boolean',
            'course_updates' => 'boolean',
            'lesson_reminders' => 'boolean',
            'quiz_reminders' => 'boolean',
            'assessment_results' => 'boolean',
            'certificate_issued' => 'boolean',
            'achievement_unlocked' => 'boolean',
            'course_completion' => 'boolean',
            'security_alerts' => 'boolean',
            'marketing' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}