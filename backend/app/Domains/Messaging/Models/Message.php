<?php

namespace App\Domains\Messaging\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class Message extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['conversation_id', 'sender_id', 'message_type', 'body', 'metadata', 'reply_to_id'];
    protected function casts(): array { return ['metadata' => 'array']; }
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
}
