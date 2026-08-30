<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\Actions\StreamMentorMessageAction;
use App\Domains\AI\Models\MentorConversation;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class StreamMentorMessageController
{
    public function __construct(
        private readonly StreamMentorMessageAction $action,
    ) {
    }

    public function __invoke(
        Request $request,
        MentorConversation $conversation,
    ): StreamedResponse {
        $validated = $request->validate([
            'message' => [
                'required',
                'string',
                'max:10000',
            ],
        ]);

        $stream = $this->action->execute(
            $conversation,
            $validated['message'],
        );

        return response()->stream(
            function () use ($stream): void {
                foreach ($stream->chunks as $chunk) {
                    echo 'data: '.json_encode([
                        'type' => 'chunk',
                        'content' => $chunk,
                    ])."\n\n";

                    if (ob_get_level() > 0) {
                        ob_flush();
                    }

                    flush();
                }

                echo 'data: '.json_encode([
                    'type' => 'done',
                ])."\n\n";

                if (ob_get_level() > 0) {
                    ob_flush();
                }

                flush();
            },
            200,
            [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Connection' => 'keep-alive',
                'X-Accel-Buffering' => 'no',
            ],
        );
    }
}