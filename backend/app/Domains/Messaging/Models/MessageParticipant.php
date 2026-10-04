<?php

namespace App\Domains\Messaging\Models;

use App\Models\User;
use Database\Factories\Domains\Messaging\MessageParticipantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MessageParticipant extends Model
{
    use HasFactory;

    protected $fillable = ['conversation_id', 'user_id', 'last_read_at', 'muted_at'];
    protected function casts(): array { return ['last_read_at' => 'datetime', 'muted_at' => 'datetime']; }

    protected static function newFactory(): MessageParticipantFactory
    {
        return MessageParticipantFactory::new();
    }

    public function conversation(): BelongsTo { return $this->belongsTo(MessageConversation::class, 'conversation_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
