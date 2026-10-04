<?php

namespace App\Domains\Messaging\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Database\Factories\Domains\Messaging\MessageFactory;

final class Message extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['conversation_id', 'sender_id', 'message_type', 'body', 'metadata', 'reply_to_id', 'edited_at'];
    protected static function newFactory(): MessageFactory
    {
        return MessageFactory::new();
    }

    protected function casts(): array { return ['metadata' => 'array', 'edited_at' => 'datetime']; }
    public function conversation(): BelongsTo { return $this->belongsTo(MessageConversation::class, 'conversation_id'); }
    public function sender(): BelongsTo { return $this->belongsTo(User::class, 'sender_id'); }
    public function replyTo(): BelongsTo { return $this->belongsTo(self::class, 'reply_to_id'); }

    public function isDeletedForAll(): bool
    {
        return is_array($this->metadata) && ! empty($this->metadata['deleted_for_all']);
    }

    /** @return int[] user ids that soft-deleted this message for themselves */
    public function deletedForIds(): array
    {
        $raw = is_array($this->metadata) ? ($this->metadata['deleted_for'] ?? []) : [];
        return array_values(array_unique(array_map('intval', (array) $raw)));
    }

    /**
     * Every attachment on this message.
     *
     * Writes store a list under `attachments`; the singular `attachment` key is
     * kept so older rows and older readers keep working.
     *
     * @return list<array>
     */
    public function attachments(): array
    {
        $metadata = is_array($this->metadata) ? $this->metadata : [];

        if (is_array($metadata['attachments'] ?? null)) {
            return array_values(array_filter(
                $metadata['attachments'],
                fn ($item): bool => is_array($item) && ! empty($item['path'])
            ));
        }

        if (is_array($metadata['attachment'] ?? null) && ! empty($metadata['attachment']['path'])) {
            return [$metadata['attachment']];
        }

        return [];
    }

    /** @return array{message_id: string, conversation_id: string, sender_name: ?string, body_excerpt: string}|null */
    public function forwardedFrom(): ?array
    {
        $metadata = is_array($this->metadata) ? $this->metadata : [];
        $origin = $metadata['forwarded_from'] ?? null;

        return is_array($origin) && ! empty($origin['message_id']) ? $origin : null;
    }
}
