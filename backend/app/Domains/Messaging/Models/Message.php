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
    protected $fillable = ['conversation_id', 'sender_id', 'message_type', 'body', 'metadata'];
    protected function casts(): array { return ['metadata' => 'array']; }
    public function conversation(): BelongsTo { return $this->belongsTo(MessageConversation::class, 'conversation_id'); }
    public function sender(): BelongsTo { return $this->belongsTo(User::class, 'sender_id'); }
}
