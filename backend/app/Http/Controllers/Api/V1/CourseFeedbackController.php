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
