<?php

namespace App\Domains\DiagnosticScenarios\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DiagnosticAttemptEvent extends Model
{
    use HasFactory; use HasUuids;
    protected $table = 'diagnostic_attempt_events';
    public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['diagnostic_scenario_attempt_id','diagnostic_scenario_id','sequence','event_type','sim_time_ms','payload','occurred_at'];
    protected function casts(): array { return ['sequence'=>'integer','sim_time_ms'=>'integer','payload'=>'array','occurred_at'=>'datetime']; }
    public function attempt(): BelongsTo { return $this->belongsTo(DiagnosticScenarioAttempt::class,'diagnostic_scenario_attempt_id'); }
}
