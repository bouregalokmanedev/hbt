<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskAssessment extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['risk_id', 'assessor_id', 'probability', 'impact', 'score', 'level', 'notes'];

    protected $casts = [
        'probability' => 'integer',
        'impact' => 'integer',
        'score' => 'integer',
    ];

    public function risk(): BelongsTo
    {
        return $this->belongsTo(Risk::class);
    }
}
