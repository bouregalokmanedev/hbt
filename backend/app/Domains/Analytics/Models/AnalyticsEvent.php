<?php

namespace App\Domains\Analytics\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsEvent extends Model
{
    protected $fillable = [
        'user_id',
        'visitor_id',
        'event',
        'page',
        'properties',
        'session_hash',
        'country',
        'region',
        'city',
        'user_agent',
        'referrer',
        'language',
    ];

    protected function casts(): array
    {
        return ['properties' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
