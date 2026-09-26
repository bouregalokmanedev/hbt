<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskTreatment extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['risk_id', 'treatment', 'description', 'status', 'owner_id', 'due_at'];

    protected $casts = ['due_at' => 'datetime'];

    public function risk(): BelongsTo
    {
        return $this->belongsTo(Risk::class);
    }
}
