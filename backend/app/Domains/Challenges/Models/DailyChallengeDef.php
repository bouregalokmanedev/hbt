<?php

namespace App\Domains\Challenges\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class DailyChallengeDef extends Model
{
    protected $table = 'daily_challenge_defs';
    protected $fillable = ['key', 'title', 'description', 'action', 'route', 'xp', 'target', 'is_active', 'sort', 'payload'];
    protected function casts(): array
    {
        return [
            'xp' => 'integer',
            'target' => 'integer',
            'is_active' => 'boolean',
            'sort' => 'integer',
            'payload' => 'array',
        ];
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(DailyChallengeAssignment::class);
    }
}
