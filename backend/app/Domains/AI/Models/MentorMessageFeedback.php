<?php

namespace App\Domains\AI\Models;

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Models\User;
use Database\Factories\Domains\AI\Models\MentorMessageFeedbackFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MentorMessageFeedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'mentor_message_id',
        'user_id',
        'rating',
        'reason',
        'comment',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'rating' => MentorFeedbackRating::class,
            'reason' => MentorFeedbackReason::class,
            'metadata' => 'array',
        ];
    }

    protected static function newFactory(): MentorMessageFeedbackFactory
    {
        return MentorMessageFeedbackFactory::new();
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(
            MentorMessage::class,
            'mentor_message_id'
        );
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}