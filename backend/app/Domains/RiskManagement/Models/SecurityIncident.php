<?php

namespace App\Domains\RiskManagement\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;

class SecurityIncident extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id', 'incident_number', 'title', 'description', 'type', 'severity', 'status',
        'detected_at', 'acknowledged_at', 'contained_at', 'resolved_at',
        'reported_by', 'assigned_to', 'source_type', 'source_id',
        'impact', 'root_cause', 'resolution', 'lessons_learned', 'metadata',
    ];

    protected $casts = [
        'detected_at' => 'datetime',
        'acknowledged_at' => 'datetime',
        'contained_at' => 'datetime',
        'resolved_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $incident): void {
            if (empty($incident->incident_number)) {
                $year = now()->year;
                $count = static::whereYear('created_at', $year)->count() + 1;
                $incident->incident_number = sprintf('INC-%d-%04d', $year, $count);
            }
        });
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function events(): HasMany
    {
        return $this->hasMany(IncidentEvent::class);
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['open', 'acknowledged', 'contained'], true);
    }
}
