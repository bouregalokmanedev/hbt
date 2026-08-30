<?php

namespace App\Domains\Progression\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StudentXpTransaction extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['user_id', 'event', 'xp', 'dedupe_key', 'metadata'];
    protected function casts(): array { return ['metadata' => 'array']; }
}
