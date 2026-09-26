<?php

namespace App\Domains\Simulator\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SimulatorSession extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'simulator_sessions';

    protected $fillable = [
        'user_id',
        'vehicle_key',
        'tool',
        'scenario_key',
        'status',
        'started_at',
        'ended_at',
        'duration_seconds',
        'score',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'duration_seconds' => 'integer',
        'score' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(SimulatorResult::class, 'session_id');
    }
}