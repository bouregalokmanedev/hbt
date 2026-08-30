<?php

namespace Database\Factories\Domains\AI\Models;

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MentorMessageFeedback>
 */
final class MentorMessageFeedbackFactory extends Factory
{
    protected $model = MentorMessageFeedback::class;

    public function definition(): array
    {
        return [
            'mentor_message_id' => MentorMessage::factory(),
            'user_id' => User::factory(),
            'rating' => MentorFeedbackRating::POSITIVE,
            'reason' => null,
            'comment' => null,
            'metadata' => null,
        ];
    }

    public function positive(): static
    {
        return $this->state([
            'rating' => MentorFeedbackRating::POSITIVE,
        ]);
    }

    public function negative(
        ?MentorFeedbackReason $reason = null,
    ): static {
        return $this->state([
            'rating' => MentorFeedbackRating::NEGATIVE,
            'reason' => $reason,
        ]);
    }
}