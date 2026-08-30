<?php

namespace App\Domains\Instructor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InstructorCourseAnalyticsResource extends JsonResource
{
    public function toArray(
        Request $request
    ): array {
        return [
            'course' => $this['course'],
            'students' => $this['students'],
            'learning' => $this['learning'],
            'lessons' => $this['lessons'],
            'enrollment' => $this['enrollment'],
            'sections' => $this['sections'],
            'lesson_performance' => $this['lesson_performance'],
            'quizzes' => $this['quizzes'],
            'engagement' => $this['engagement'],
        ];
    }
}
