<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Support\Models\CannedReply;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Per-agent canned reply templates. Scoped to the authenticated agent via
 * user_id — every method filters on it, so one agent's macros stay private.
 */
class CannedReplyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $replies = CannedReply::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('position')
            ->orderBy('title')
            ->get()
            ->map(fn (CannedReply $reply) => [
                'id' => $reply->id,
                'title' => $reply->title,
                'body' => $reply->body,
            ]);

        return response()->json(['data' => $replies]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'min:1', 'max:5000'],
        ]);

        $reply = CannedReply::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'body' => $data['body'],
            'position' => CannedReply::query()->where('user_id', $request->user()->id)->count(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Canned reply saved.',
            'data' => ['id' => $reply->id, 'title' => $reply->title, 'body' => $reply->body],
        ], 201);
    }

    public function update(Request $request, CannedReply $reply): JsonResponse
    {
        $this->authorizeOwnership($reply, $request);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:120'],
            'body' => ['sometimes', 'string', 'min:1', 'max:5000'],
        ]);

        $reply->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Canned reply updated.',
            'data' => ['id' => $reply->id, 'title' => $reply->title, 'body' => $reply->body],
        ]);
    }

    public function destroy(Request $request, CannedReply $reply): JsonResponse
    {
        $this->authorizeOwnership($reply, $request);
        $reply->delete();

        return response()->json(['success' => true, 'message' => 'Canned reply deleted.']);
    }

    private function authorizeOwnership(CannedReply $reply, Request $request): void
    {
        abort_unless($reply->user_id === $request->user()->id, 403, 'This template belongs to another agent.');
    }
}
