<?php

namespace App\Domains\Students\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentAssessmentPreference extends Model
{
    protected $fillable = ['user_id', 'show_timer', 'confirm_before_submit', 'show_result_breakdown', 'email_result_notifications'];

    protected function casts(): array
    {
        return [
            'show_timer' => 'boolean',
            'confirm_before_submit' => 'boolean',
            'show_result_breakdown' => 'boolean',
            'email_result_notifications' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
