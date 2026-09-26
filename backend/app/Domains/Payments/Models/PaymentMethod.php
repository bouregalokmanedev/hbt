<?php

namespace App\Domains\Payments\Models;

use App\Domains\Payments\Enums\PaymentMethodType;
use App\Domains\Payments\Enums\PaymentProvider;
use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'provider', 'provider_payment_method_id', 'type',
        'brand', 'last_four', 'exp_month', 'exp_year', 'is_default',
        'billing_name', 'billing_country', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'provider' => PaymentProvider::class,
            'type' => PaymentMethodType::class,
            'is_default' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function displayName(): string
    {
        if ($this->type === PaymentMethodType::PAYPAL) {
            return 'PayPal';
        }
        if ($this->type === PaymentMethodType::TAMARA) {
            return 'Tamara';
        }
        if ($this->brand && $this->last_four) {
            return ucfirst($this->brand).' ···· '.$this->last_four;
        }
        return $this->brand ?? $this->type->value;
    }
}
