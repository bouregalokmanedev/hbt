<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class VehicleVariant extends Model
{
    use HasUuids;
    protected $table = 'vehicle_variants';
    public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['model_id','name','engine_code','fuel_type','transmission','year_from','year_to','metadata'];
    protected function casts(): array { return ['metadata'=>'array','year_from'=>'integer','year_to'=>'integer']; }
    public function model(): BelongsTo { return $this->belongsTo(VehicleModel::class,'model_id'); }
    public function dataPacks(): HasMany { return $this->hasMany(SimulatorDataPack::class,'vehicle_variant_id'); }
}
