<?php

namespace App\Domains\Payments\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class WebhookEvent extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'provider', 'event_id', 'event_type', 'payload', 'status',
        'processed_at', 'failed_at', 'attempts', 'error_message',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function markProcessed(): void
    {
        $this->update(['status' => 'processed', 'processed_at' => now()]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'failed_at' => now(),
            'error_message' => $error,
            'attempts' => $this->attempts + 1,
        ]);
    }

    public function isDuplicate(): bool
    {
        return $this->wasRecentlyCreated === false && $this->exists;
    }
}
