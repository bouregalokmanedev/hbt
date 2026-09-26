<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class VehicleModel extends Model
{
    use HasUuids;
    protected $table = 'vehicle_models';
    public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['make_id','name','slug'];
    public function make(): BelongsTo { return $this->belongsTo(VehicleMake::class,'make_id'); }
    public function variants(): HasMany { return $this->hasMany(VehicleVariant::class,'model_id'); }
}
