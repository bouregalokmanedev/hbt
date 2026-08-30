<?php

namespace Tests\Feature\Domains\AI;

use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Resources\MentorConversationResource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class MentorConversationResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_conversation_resource_returns_conversation_data(): void
    {
        $conversation = MentorConversation::factory()->create([
            'title' => 'Engine Management Help',
            'context' => [
                'course_id' => 'course-123',
                'lesson_id' => 'lesson-456',
            ],
        ]);

        $resource = new MentorConversationResource($conversation);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            $conversation->id,
            $data['data']['id']
        );

        $this->assertSame(
            $conversation->course_id,
            $data['data']['course_id']
        );

        $this->assertSame(
            'Engine Management Help',
            $data['data']['title']
        );

        $this->assertSame(
            $conversation->context,
            $data['data']['context']
        );
    }

    public function test_conversation_resource_serializes_status(): void
    {
        $conversation = MentorConversation::factory()->create([
            'status' => MentorConversationStatus::ACTIVE,
        ]);

        $resource = new MentorConversationResource($conversation);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            MentorConversationStatus::ACTIVE->value,
            $data['data']['status']
        );
    }

    public function test_conversation_resource_includes_messages_when_loaded(): void
    {
        $conversation = MentorConversation::factory()
            ->has(
                MentorMessage::factory()->count(2),
                'messages'
            )
            ->create();

        $conversation->load('messages');

        $resource = new MentorConversationResource($conversation);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertArrayHasKey(
            'messages',
            $data['data']
        );

        $this->assertCount(
            2,
            $data['data']['messages']
        );
    }

    public function test_conversation_resource_does_not_force_load_messages(): void
    {
        $conversation = MentorConversation::factory()->create();

        $resource = new MentorConversationResource($conversation);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertArrayNotHasKey(
            'messages',
            $data['data']
        );

        $this->assertFalse(
            $conversation->relationLoaded('messages')
        );
    }

    public function test_conversation_resource_serializes_timestamps(): void
    {
        $conversation = MentorConversation::factory()->create();

        $resource = new MentorConversationResource($conversation);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            $conversation->created_at->toISOString(),
            $data['data']['created_at']
        );

        $this->assertSame(
            $conversation->updated_at->toISOString(),
            $data['data']['updated_at']
        );
    }
}