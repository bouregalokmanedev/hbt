<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseFeedback;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CourseFeedbackController extends Controller
{
    public function index(Course $course): JsonResponse
    {
        $feedback = CourseFeedback::query()
            ->with('user:id,first_name,last_name')
            ->where('course_id', $course->id)
            ->latest()
            ->take(50)
            ->get();

        return response()->json([
            'data' => [
                'summary' => [
                    'count' => $feedback->count(),
                    'average_rating' => round((float) ($feedback->avg('rating') ?? 0), 1),
                ],
                'reviews' => $feedback->map(fn (CourseFeedback $item) => [
                    'id' => $item->id,
                    'rating' => $item->rating,
                    'comment' => $item->comment,
                    'reviewer' => trim(($item->user?->first_name ?? '') . ' ' . ($item->user?->last_name ?? '')) ?: 'Learner',
                    'created_at' => $item->created_at?->toISOString(),
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $data = $request->validate([
            'lesson_id' => ['nullable', 'uuid'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        if (isset($data['lesson_id'])) {
            $belongsToCourse = Lesson::query()
                ->whereKey($data['lesson_id'])
                ->whereHas('section', fn ($query) => $query->where('course_id', $course->id))
                ->exists();

            abort_unless($belongsToCourse, 422, 'The lesson does not belong to this course.');
        }

        $feedback = CourseFeedback::query()->create([
            ...$data,
            'course_id' => $course->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $feedback], 201);
    }
}
