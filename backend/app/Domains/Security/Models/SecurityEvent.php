<?php

namespace App\Domains\Security\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class SecurityEvent extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id', 'user_id', 'actor_id', 'event_type', 'severity',
        'ip_address', 'user_agent', 'device_id', 'session_id',
        'target_type', 'target_id', 'success', 'failure_reason', 'metadata', 'occurred_at',
    ];

    protected $casts = [
        'success' => 'boolean',
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
