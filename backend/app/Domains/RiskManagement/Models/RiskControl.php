<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskControl extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['risk_id', 'name', 'description', 'control_type', 'status', 'owner_id', 'effectiveness_score', 'last_tested_at', 'next_test_at'];

    protected $casts = [
        'effectiveness_score' => 'integer',
        'last_tested_at' => 'datetime',
        'next_test_at' => 'datetime',
    ];

    public function risk(): BelongsTo
    {
        return $this->belongsTo(Risk::class);
    }
}
