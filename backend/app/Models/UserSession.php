<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UserSession extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [

        'user_id',

        'token_id',

        'device_name',

        'browser',

        'platform',

        'device_type',

        'ip_address',

        'user_agent',

        'logged_in_at',

        'logged_out_at',

        'last_activity_at',

        'is_current',

    ];

    protected function casts(): array
    {
        return [

            'logged_in_at' => 'datetime',

            'logged_out_at' => 'datetime',

            'last_activity_at' => 'datetime',

            'is_current' => 'boolean',

        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}