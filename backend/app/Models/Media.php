<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'uploaded_by',
        'disk',
        'path',
        'original_name',
        'filename',
        'mime_type',
        'extension',
        'size',
        'type',
        'mediable_type',
        'mediable_id',
        'metadata',
    ];

   protected function casts(): array
{
    return [
        'size' => 'integer',
        'metadata' => 'array',
        'type' => \App\Enums\MediaType::class,
    ];
}

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'uploaded_by'
        );
    }

    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }
}