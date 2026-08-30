<?php

namespace App\Domains\Progression\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StudentProgressionProfile extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['user_id', 'total_xp', 'level', 'current_streak', 'longest_streak', 'last_activity_date'];

    protected function casts(): array
    {
        return ['last_activity_date' => 'date'];
    }
}
