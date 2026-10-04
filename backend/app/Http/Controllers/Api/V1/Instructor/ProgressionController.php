<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Progression\Services\InstructorProgressionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The instructor's own teaching progression: XP, level, streak and the
 * actions that earned them. Kept entirely separate from the student
 * progression/leaderboard so teaching never ranks an instructor among learners.
 */
final class ProgressionController extends Controller
{
    public function index(Request $request, InstructorProgressionService $progression): JsonResponse
    {
        return response()->json([
            'data' => $progression->summaryFor($request->user()),
        ]);
    }
}
