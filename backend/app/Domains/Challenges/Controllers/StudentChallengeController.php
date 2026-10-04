<?php

namespace App\Domains\Challenges\Controllers;

use App\Domains\Challenges\Services\DailyChallengeService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentChallengeController
{
    public function __construct(private readonly DailyChallengeService $service) {}

    public function today(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        return response()->json(['data' => $this->service->todayFor($user)]);
    }

    public function review(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        return response()->json(['data' => $this->service->review($user)]);
    }

    public function leaderboard(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $limit = min(max((int) $request->integer('limit', 20), 1), 50);
        return response()->json(['data' => $this->service->leaderboard($user, $limit)]);
    }

    public function activity(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $limit = min(max((int) $request->integer('limit', 30), 1), 50);
        return response()->json(['data' => $this->service->activity($user, $limit)]);
    }

    public function peers(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        return response()->json(['data' => $this->service->peers($user)]);
    }

    public function rivals(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        return response()->json(['data' => $this->service->rivals($user)]);
    }

    public function challenge(Request $request): JsonResponse
    {
        $data = $request->validate(['user_id' => ['required', 'string']]);
        /** @var User $user */
        $user = $request->user();
        try {
            $rival = $this->service->challenge($user, $data['user_id']);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $this->messageFor($e)], 422);
        }
        return response()->json(['data' => ['rival' => $rival]]);
    }

    public function accept(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        try {
            $rival = $this->service->accept($user, $id);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $this->messageFor($e)], 404);
        }
        return response()->json(['data' => ['rival' => $rival]]);
    }

    public function share(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        try {
            $result = $this->service->shareResult($user, $id);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $this->messageFor($e)], 404);
        }
        return response()->json(['data' => $result]);
    }

    public function claim(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        try {
            $challenge = $this->service->claim($user, $id);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $this->messageFor($e)], 422);
        }

        if ($challenge === null) {
            return response()->json(['message' => 'That challenge is no longer available.'], 404);
        }

        return response()->json(['data' => ['challenge' => $challenge]]);
    }

    /**
     * The service throws plain RuntimeExceptions that carry fixed, user
     * facing copy. Storage failures also arrive as RuntimeException
     * subclasses (QueryException extends PDOException extends
     * RuntimeException), so anything that smells of SQL or a connection
     * string is reported to the log and replaced with a safe sentence.
     */
    private function messageFor(\RuntimeException $e): string
    {
        $message = $e->getMessage();

        if ($e instanceof \PDOException || str_contains($message, 'SQL') || str_contains($message, 'Connection:')) {
            report($e);

            return 'Unable to complete that action right now. Please try again.';
        }

        return $message;
    }
}
