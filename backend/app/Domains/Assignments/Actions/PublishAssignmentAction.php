<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Models\Assignment;
use Illuminate\Validation\ValidationException;

final class PublishAssignmentAction
{
    public function execute(Assignment $assignment): Assignment
    {
        if ($assignment->status === AssignmentStatus::PUBLISHED) {
            return $assignment;
        }

        if (trim($assignment->title) === '') {
            throw ValidationException::withMessages([
                'title' => 'Add a title before publishing this assignment.',
            ]);
        }

        if (trim($assignment->instructions) === '') {
            throw ValidationException::withMessages([
                'instructions' => 'Add instructions before publishing this assignment.',
            ]);
        }

        $assignment->forceFill([
            'status' => AssignmentStatus::PUBLISHED,
            'published_at' => now(),
        ])->save();

        return $assignment->fresh();
    }
}
