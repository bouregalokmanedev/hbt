<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\DTOs\SubmitAssignmentData;
use App\Domains\Assignments\Enums\AssignmentSubmissionStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class SubmitAssignmentAction
{
    public function execute(
        Assignment $assignment,
        User $student,
        SubmitAssignmentData $data,
    ): AssignmentSubmission {
        if (! $assignment->isPublished()) {
            throw ValidationException::withMessages([
                'assignment' => 'This assignment is not open for submissions.',
            ]);
        }

        if (
            $assignment->isPastDue()
            && ! $assignment->allow_late_submissions
        ) {
            throw ValidationException::withMessages([
                'assignment' => 'The deadline for this assignment has passed.',
            ]);
        }

        if ($data->content === null && $data->linkUrl === null) {
            throw ValidationException::withMessages([
                'content' => 'Add a written response or a link before submitting.',
            ]);
        }

        $submission = AssignmentSubmission::query()->firstOrNew([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
        ]);

        if ($submission->exists && $submission->isGraded()) {
            throw ValidationException::withMessages([
                'submission' => 'This submission has already been graded and cannot be changed.',
            ]);
        }

        $submission->fill([
            'content' => $data->content,
            'link_url' => $data->linkUrl,
            'status' => AssignmentSubmissionStatus::SUBMITTED,
            'grade' => null,
            'feedback' => null,
            'submitted_at' => now(),
            'graded_at' => null,
            'graded_by' => null,
        ])->save();

        return $submission->fresh();
    }
}
