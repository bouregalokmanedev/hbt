<?php

namespace App\Domains\Students\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPrivacySetting extends Model
{
    protected $fillable = [
        'user_id',
        'profile_visibility',
        'show_learning_activity',
        'show_achievements',
        'show_certificates',
        'show_course_progress',
        'allow_personalized_recommendations',
        'allow_analytics',
    ];

    protected function casts(): array
    {
        return [
            'show_learning_activity' => 'boolean',
            'show_achievements' => 'boolean',
            'show_certificates' => 'boolean',
            'show_course_progress' => 'boolean',
            'allow_personalized_recommendations' => 'boolean',
            'allow_analytics' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}