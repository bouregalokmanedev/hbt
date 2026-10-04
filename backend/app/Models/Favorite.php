<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    public const TYPE_COURSE = 'course';

    public const TYPE_LESSON = 'lesson';

    public const TYPE_NOTE = 'note';

    public const TYPES = [
        self::TYPE_COURSE,
        self::TYPE_LESSON,
        self::TYPE_NOTE,
    ];

    protected $fillable = [
        'user_id',
        'favoritable_type',
        'favoritable_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('favoritable_type', $type);
    }

    public static function key(string $type, string $id): string
    {
        return $type.':'.$id;
    }
}
