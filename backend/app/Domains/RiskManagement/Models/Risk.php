<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class Risk extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id', 'category_id', 'title', 'description', 'status', 'level',
        'probability', 'impact', 'score', 'owner_id', 'next_review_at', 'closed_at', 'metadata',
    ];

    protected $casts = [
        'probability' => 'integer',
        'impact' => 'integer',
        'score' => 'integer',
        'metadata' => 'array',
        'next_review_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(RiskCategory::class, 'category_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(RiskAssessment::class);
    }

    public function treatments(): HasMany
    {
        return $this->hasMany(RiskTreatment::class);
    }

    public function controls(): HasMany
    {
        return $this->hasMany(RiskControl::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(RiskReview::class);
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(RiskEvidence::class);
    }
}
