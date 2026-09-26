<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SimulatorDataPack extends Model
{
    use HasUuids;
    protected $table = 'simulator_data_packs';
    public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['vehicle_variant_id','code','version','status','manifest','created_by'];
    protected function casts(): array { return ['manifest'=>'array']; }
    public function vehicleVariant(): BelongsTo { return $this->belongsTo(VehicleVariant::class,'vehicle_variant_id'); }
}
