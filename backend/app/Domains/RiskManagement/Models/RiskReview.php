<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class RiskReview extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['risk_id', 'reviewer_id', 'reviewed_at', 'next_review_at', 'outcome', 'notes', 'metadata'];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'next_review_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function risk(): BelongsTo
    {
        return $this->belongsTo(Risk::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
