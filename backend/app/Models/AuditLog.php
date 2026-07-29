<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AuditLog extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [

        'user_id',

        'event',

        'auditable_type',

        'auditable_id',

        'old_values',

        'new_values',

        'ip_address',

        'user_agent',

        'metadata',

    ];

    protected function casts(): array
    {
        return [

            'old_values' => 'array',

            'new_values' => 'array',

            'metadata' => 'array',

        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}