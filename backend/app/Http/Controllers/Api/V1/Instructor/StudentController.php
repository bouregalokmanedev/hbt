<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Instructor\Queries\InstructorStudentQuery;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 20), 1), 100);

        return response()->json(
            InstructorStudentQuery::for((int) $request->user()->id)
                ->paginate($request->string('search')->toString() ?: null, $perPage)
        );
    }

    public function show(Request $request, int $student): JsonResponse
    {
        return response()->json([
            'data' => InstructorStudentQuery::for((int) $request->user()->id)
                ->profile($student),
        ]);
    }

    public function progress(Request $request, int $student): JsonResponse
    {
        $profile = InstructorStudentQuery::for((int) $request->user()->id)
            ->profile($student);

        return response()->json([
            'data' => [
                'student' => $profile['student'],
                'courses' => $profile['courses'],
            ],
        ]);
    }

    public function assessments(Request $request, int $student): JsonResponse
    {
        $profile = InstructorStudentQuery::for((int) $request->user()->id)
            ->profile($student);

        return response()->json([
            'data' => [
                'student' => $profile['student'],
                'quiz_attempts' => $profile['quiz_attempts'],
                'assessment_attempts' => $profile['assessment_attempts'],
            ],
        ]);
    }
}
