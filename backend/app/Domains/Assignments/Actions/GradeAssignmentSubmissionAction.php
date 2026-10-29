<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\DTOs\GradeAssignmentSubmissionData;
use App\Domains\Assignments\Enums\AssignmentSubmissionStatus;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class GradeAssignmentSubmissionAction
{
    public function execute(
        AssignmentSubmission $submission,
        User $grader,
        GradeAssignmentSubmissionData $data,
    ): AssignmentSubmission {
        $submission->loadMissing('assignment');
        $maximum = (int) $submission->assignment->max_points;

        if ($data->grade < 0 || $data->grade > $maximum) {
            throw ValidationException::withMessages([
                'grade' => "The grade must be between 0 and {$maximum}.",
            ]);
        }

        $submission->forceFill([
            'grade' => $data->grade,
            'feedback' => $data->feedback,
            'status' => AssignmentSubmissionStatus::GRADED,
            'graded_at' => now(),
            'graded_by' => $grader->id,
        ])->save();

        return $submission->fresh(['student']);
    }
}
