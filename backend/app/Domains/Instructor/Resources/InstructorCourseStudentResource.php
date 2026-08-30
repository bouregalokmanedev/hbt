<?php

namespace App\Domains\Instructor\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InstructorCourseStudentResource extends JsonResource
{
    public function toArray(
        Request $request
    ): array {
        $enrollment = $this['enrollment'];
        $progress = $this['progress'];

        return [
            'student' => [
    'id' => $enrollment->user->id,
    'name' => trim(
        $enrollment->user->first_name . ' ' .
        $enrollment->user->last_name
    ),
    'username' => $enrollment->user->username,
    'email' => $enrollment->user->email,
],

            'enrollment' => [
                'id' => $enrollment->id,
                'status' => $enrollment->status->value,
                'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                'completed_at' => $enrollment->completed_at?->toISOString(),
            ],

            'progress' => [
                'percentage' => $progress?->progress_percentage ?? 0,
                'time_spent' => $progress?->time_spent ?? 0,
                'completed_at' => $progress?->completed_at?->toISOString(),
            ],

            'lessons' => [
                'completed' => $this['completed_lessons'],
                'total' => $this['total_lessons'],
            ],

            'last_activity_at' => $this['last_activity_at']?->toISOString(),
        ];
    }
}