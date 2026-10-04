<?php

namespace App\Domains\Support\Models;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportMail extends Model
{
    use HasUuids;

    public const string DIRECTION_INBOUND = 'inbound';

    public const string DIRECTION_OUTBOUND = 'outbound';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'thread_id', 'direction', 'subject', 'body',
        'from_name', 'from_email', 'to_name', 'to_email',
        'sender_user_id', 'recipient_user_id', 'contact_message_id',
        'read_at', 'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'thread_id');
    }

    public function root(): BelongsTo
    {
        return $this->belongsTo(self::class, 'thread_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_user_id');
    }

    public function contactMessage(): BelongsTo
    {
        return $this->belongsTo(ContactMessage::class);
    }

    public function isRoot(): bool
    {
        return $this->thread_id === null;
    }

    /**
     * A thread is its root plus every reply; roots carry thread_id = null so
     * the inbox can paginate a single table.
     */
    public function scopeRoots(Builder $query): Builder
    {
        return $query->whereNull('thread_id');
    }

    public function scopeInFolder(Builder $query, string $folder): Builder
    {
        if ($folder === 'sent') {
            return $query->roots()
                ->where('direction', self::DIRECTION_OUTBOUND)
                ->whereNull('archived_at');
        }

        if ($folder === 'archive') {
            return $query->roots()->whereNotNull('archived_at');
        }

        return $query->roots()
            ->where('direction', self::DIRECTION_INBOUND)
            ->whereNull('archived_at');
    }
}
