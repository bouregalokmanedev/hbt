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
        'provider', 'event_id', 'event_type', 'payload', 'status', 'claimed_at',
        'processed_at', 'failed_at', 'attempts', 'error_message',
    ];

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_PROCESSED = 'processed';

    public const STATUS_FAILED = 'failed';

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'claimed_at' => 'datetime',
            'processed_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function markProcessed(): void
    {
        self::query()->whereKey($this->getKey())->update([
            'status' => self::STATUS_PROCESSED,
            'processed_at' => now(),
            'claimed_at' => null,
            'failed_at' => null,
            'error_message' => null,
        ]);
    }

    public function markFailed(string $error): void
    {
        self::query()->whereKey($this->getKey())->update([
            'status' => self::STATUS_FAILED,
            'failed_at' => now(),
            'claimed_at' => null,
            'error_message' => $error,
        ]);
    }

    public function isDuplicate(): bool
    {
        return $this->wasRecentlyCreated === false && $this->exists;
    }
}
