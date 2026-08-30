<?php

namespace Database\Factories\Domains\AI\Models;

use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Models\MentorMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

class MentorMessageFactory extends Factory
{
    protected $model = MentorMessage::class;

    public function definition(): array
    {
        return [
            'mentor_conversation_id' => MentorConversation::factory(),
            'role' => MentorMessageRole::USER,
            'content' => fake()->paragraph(),
            'metadata' => [],
        ];
    }

    public function assistant(): static
    {
        return $this->state(fn () => [
            'role' => MentorMessageRole::ASSISTANT,
        ]);
    }

    public function system(): static
    {
        return $this->state(fn () => [
            'role' => MentorMessageRole::SYSTEM,
        ]);
    }
}