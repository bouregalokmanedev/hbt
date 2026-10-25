<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Courses\Services\CourseGradeService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class InstructorGradebookController extends Controller
{
    public function show(
        Request $request,
        Course $course,
        CourseGradeService $grades,
    ): JsonResponse {
        $this->authorize('update', $course);

        $students = $grades->roster($course);
        $scores = array_map(fn ($row) => $row['grade']['overall_score'], $students);

        return response()->json([
            'data' => [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'students' => $students,
                'summary' => [
                    'students' => count($students),
                    'average_score' => $scores === [] ? 0 : (int) round(array_sum($scores) / count($scores)),
                    'passing' => count(array_filter($students, fn ($row) => $row['grade']['passed'])),
                ],
            ],
        ]);
    }
}
