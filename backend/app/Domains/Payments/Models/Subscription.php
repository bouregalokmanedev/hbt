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
        'user_id', 'plan_id', 'provider', 'provider_ref', 'status',
        'trial_ends_at', 'current_period_ends_at', 'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => SubscriptionStatus::class,
            'trial_ends_at' => 'datetime',
            'current_period_ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
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
