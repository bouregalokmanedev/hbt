<?php

namespace App\Domains\Challenges\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DailyChallengeRival extends Model
{
    protected $table = 'daily_challenge_rivals';
    protected $fillable = ['challenger_id', 'challenged_id', 'date', 'status', 'result'];
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'result' => 'array',
        ];
    }

    public function challenger(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'challenger_id');
    }

    public function challenged(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'challenged_id');
    }
}
