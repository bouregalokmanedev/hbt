<?php

namespace App\Domains\Challenges\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DailyChallengeAssignment extends Model
{
    protected $table = 'daily_challenge_assignments';
    protected $fillable = [
        'user_id', 'daily_challenge_def_id', 'date', 'status', 'progress',
        'target', 'xp_awarded', 'completed_at', 'detail',
    ];
    protected function casts(): array
    {
        return [
            'progress' => 'integer',
            'target' => 'integer',
            'xp_awarded' => 'integer',
            'date' => 'date',
            'completed_at' => 'datetime',
            'detail' => 'array',
        ];
    }

    public function def(): BelongsTo
    {
        return $this->belongsTo(DailyChallengeDef::class, 'daily_challenge_def_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
