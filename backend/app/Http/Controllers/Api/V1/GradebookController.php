<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Courses\Services\CourseAccessService;
use App\Domains\Courses\Services\CourseGradeService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class GradebookController extends Controller
{
    public function show(
        Request $request,
        Course $course,
        CourseAccessService $access,
        CourseGradeService $grades,
    ): JsonResponse {
        abort_unless($access->hasFullAccess($request->user(), $course), 403);

        return response()->json([
            'data' => $grades->forStudent($course, $request->user()),
        ]);
    }
}
