<?php

namespace App\Domains\Payments\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name', 'slug', 'description', 'price', 'currency',
        'interval', 'trial_days', 'features', 'active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'trial_days' => 'integer',
            'features' => 'array',
            'active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
