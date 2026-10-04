<?php

namespace Database\Factories\Domains\Messaging;

use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
final class MessageFactory extends Factory
{
    protected $model = Message::class;

    public function definition(): array
    {
        return [
            'conversation_id' => MessageConversation::factory(),
            'sender_id' => User::factory(),
            'message_type' => 'text',
            'body' => fake()->sentence(),
            'metadata' => null,
            'reply_to_id' => null,
        ];
    }

    public function announcement(): static
    {
        return $this->state(fn () => ['message_type' => 'announcement']);
    }

    public function withAttachment(string $path, string $name = 'file.pdf', string $mime = 'application/pdf'): static
    {
        return $this->state(fn () => [
            'metadata' => [
                'attachments' => [['name' => $name, 'mime' => $mime, 'size' => 1024, 'path' => $path]],
            ],
        ]);
    }

    public function deletedForEveryone(): static
    {
        return $this->state(fn () => [
            'body' => null,
            'metadata' => ['deleted_for_all' => true],
        ]);
    }
}
