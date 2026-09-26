<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class IncidentEvent extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['security_incident_id', 'user_id', 'event', 'description', 'metadata'];

    protected $casts = ['metadata' => 'array'];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(SecurityIncident::class, 'security_incident_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
