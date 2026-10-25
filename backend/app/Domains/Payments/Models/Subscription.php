<?php

namespace App\Domains\Payments\Models;

use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'plan_id', 'provider', 'provider_ref',
        'provider_subscription_id', 'provider_customer_id',
        'currency', 'amount', 'billing_interval', 'billing_interval_count',
        'status', 'trial_starts_at', 'trial_ends_at', 'starts_at',
        'current_period_start', 'current_period_ends_at',
        'cancel_at_period_end', 'cancelled_at', 'ended_at', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'amount' => 'integer',
            'trial_starts_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'starts_at' => 'datetime',
            'current_period_start' => 'datetime',
            'current_period_ends_at' => 'datetime',
            'cancel_at_period_end' => 'boolean',
            'cancelled_at' => 'datetime',
            'ended_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function isEntitled(): bool
    {
        if (! in_array($this->status, [
            SubscriptionStatus::TRIAL,
            SubscriptionStatus::ACTIVE,
            SubscriptionStatus::PAST_DUE,
        ], true)) {
            return false;
        }

        $endsAt = $this->current_period_ends_at
            ?? ($this->status === SubscriptionStatus::TRIAL ? $this->trial_ends_at : null);

        return $endsAt === null || $endsAt->isFuture();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscriptionItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SubscriptionItem::class);
    }

    public function grantsAccess(): bool
    {
        return in_array($this->status, [
            SubscriptionStatus::TRIAL,
            SubscriptionStatus::ACTIVE,
            SubscriptionStatus::PAST_DUE,
        ], true);
    }
}
