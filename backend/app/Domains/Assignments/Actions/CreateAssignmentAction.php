<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\DTOs\CreateAssignmentData;
use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Models\Course;
use Illuminate\Support\Str;

final class CreateAssignmentAction
{
    public function execute(
        Course $course,
        CreateAssignmentData $data,
    ): Assignment {
        return Assignment::create([
            'course_id' => $course->id,
            'title' => $data->title,
            'slug' => $this->uniqueSlug(
                $course,
                $data->slug ?? $data->title,
            ),
            'instructions' => $data->instructions,
            'max_points' => max(1, $data->maxPoints),
            'allow_late_submissions' => $data->allowLateSubmissions,
            'due_at' => $data->dueAt,
            'status' => AssignmentStatus::DRAFT,
            'published_at' => null,
        ]);
    }

    private function uniqueSlug(Course $course, string $value): string
    {
        $base = Str::slug($value);

        if ($base === '') {
            $base = 'assignment';
        }

        $slug = $base;
        $suffix = 2;

        while (
            Assignment::query()
                ->where('course_id', $course->id)
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
