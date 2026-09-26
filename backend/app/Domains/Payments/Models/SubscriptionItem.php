<?php

namespace App\Domains\Payments\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionItem extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['subscription_id', 'subscription_plan_id', 'quantity', 'unit_amount', 'currency'];

    protected function casts(): array
    {
        return ['quantity' => 'integer', 'unit_amount' => 'integer'];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
