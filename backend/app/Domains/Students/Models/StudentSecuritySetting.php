<?php

namespace App\Domains\Students\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSecuritySetting extends Model
{
    protected $fillable = [
        'user_id',
        'two_factor_enabled',
        'two_factor_method',
        'two_factor_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'two_factor_enabled' => 'boolean',
            'two_factor_verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}