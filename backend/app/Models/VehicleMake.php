<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class VehicleMake extends Model
{
    use HasUuids;
    protected $table = 'vehicle_makes';
    public $incrementing = false; protected $keyType = 'string';
    protected $fillable = ['name','slug','country'];
    public function models(): HasMany { return $this->hasMany(VehicleModel::class,'make_id'); }
}
