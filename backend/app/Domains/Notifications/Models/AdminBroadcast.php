<?php

namespace App\Domains\Notifications\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AdminBroadcast extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'admin_id',
        'audience',
        'type',
        'title',
        'message',
        'action_url',
        'replies_enabled',
        'quick_replies',
        'recipient_count',
        'delivered_count',
        'failed_count',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'recipient_count' => 'integer',
            'delivered_count' => 'integer',
            'failed_count' => 'integer',
            'delivered_at' => 'datetime',
            'replies_enabled' => 'boolean',
            'quick_replies' => 'array',
        ];
    }

    public function administrator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
