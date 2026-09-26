<?php

namespace App\Domains\Security\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class RiskSignal extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id', 'type', 'severity', 'user_id', 'ip_address', 'event_type', 'score', 'context', 'status', 'occurred_at',
    ];

    protected $casts = [
        'context' => 'array',
        'score' => 'integer',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
