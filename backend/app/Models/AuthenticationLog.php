<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AuthenticationLog extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [

        'user_id',

        'event',

        'successful',

        'email',

        'ip_address',

        'user_agent',

        'browser',

        'platform',

        'device_type',

        'failure_reason',

        'metadata',

    ];

    protected function casts(): array
    {
        return [

            'successful'=>'boolean',

            'metadata'=>'array',

        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}