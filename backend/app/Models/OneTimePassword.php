<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OneTimePassword extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [

        'user_id',

        'purpose',

        'code',

        'expires_at',

        'verified_at',

        'attempts',

        'metadata',

    ];

    protected function casts(): array
    {
        return [

            'expires_at'=>'datetime',

            'verified_at'=>'datetime',

            'metadata'=>'array',

        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
