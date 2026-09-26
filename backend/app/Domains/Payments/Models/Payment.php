<?php

namespace App\Domains\Payments\Models;

use App\Domains\Payments\Enums\PaymentMethodType;
use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'order_id', 'user_id', 'provider', 'provider_payment_id', 'provider_customer_id',
        'payment_method_type', 'amount', 'currency', 'status',
        'paid_at', 'failed_at', 'refunded_at', 'failure_code', 'failure_message',
        'idempotency_key', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'provider' => PaymentProvider::class,
            'payment_method_type' => PaymentMethodType::class,
            'status' => PaymentStatus::class,
            'amount' => 'integer',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
            'refunded_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function canBeRefunded(): bool
    {
        return $this->status === PaymentStatus::SUCCEEDED;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [PaymentStatus::PENDING, PaymentStatus::REQUIRES_ACTION], true);
    }
}
