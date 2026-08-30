<?php

namespace Tests\Feature\Domains\AI;

use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Resources\MentorMessageResource;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class MentorMessageResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_message_resource_returns_message_data(): void
    {
        $message = MentorMessage::factory()->create([
            'content' => 'Explain fuel trim.',
        ]);

        $resource = new MentorMessageResource($message);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            $message->id,
            $data['data']['id']
        );

        $this->assertSame(
            $message->mentor_conversation_id,
            $data['data']['mentor_conversation_id']
        );

        $this->assertSame(
            'Explain fuel trim.',
            $data['data']['content']
        );
    }

    public function test_message_resource_serializes_role(): void
    {
        $message = MentorMessage::factory()->create([
            'role' => MentorMessageRole::USER,
        ]);

        $resource = new MentorMessageResource($message);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            MentorMessageRole::USER->value,
            $data['data']['role']
        );
    }

    public function test_message_resource_serializes_metadata(): void
    {
        $metadata = [
            'course_id' => 'course-123',
            'lesson_id' => 'lesson-456',
            'sources' => [
                'lesson',
                'quiz_result',
            ],
        ];

        $message = MentorMessage::factory()->create([
            'metadata' => $metadata,
        ]);

        $resource = new MentorMessageResource($message);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            $metadata,
            $data['data']['metadata']
        );
    }

    public function test_message_resource_serializes_timestamps(): void
    {
        $message = MentorMessage::factory()->create();

        $resource = new MentorMessageResource($message);

        $data = $resource
            ->toResponse(Request::create('/'))
            ->getData(true);

        $this->assertSame(
            $message->created_at->toISOString(),
            $data['data']['created_at']
        );

        $this->assertSame(
            $message->updated_at->toISOString(),
            $data['data']['updated_at']
        );
    }
}