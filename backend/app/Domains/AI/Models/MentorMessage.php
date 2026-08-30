<?php

namespace App\Domains\AI\Models;
use App\Domains\AI\Enums\MentorMessageRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\AI\Models\MentorMessageFeedback;


class MentorMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentor_conversation_id',
        'role',
        'content',
        'metadata',
    ];

    protected function casts(): array
{
    return [
        'metadata' => 'array',
        'role' => MentorMessageRole::class,
    ];
}

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(
            MentorConversation::class,
            'mentor_conversation_id'
        );
    }

    public function feedback(): HasOne
{
    return $this->hasOne(
        MentorMessageFeedback::class,
        'mentor_message_id'
    );
}

}