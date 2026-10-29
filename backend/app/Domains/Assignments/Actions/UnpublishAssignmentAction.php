<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Models\Assignment;

final class UnpublishAssignmentAction
{
    public function execute(Assignment $assignment): Assignment
    {
        if ($assignment->status !== AssignmentStatus::DRAFT) {
            $assignment->forceFill([
                'status' => AssignmentStatus::DRAFT,
                'published_at' => null,
            ])->save();
        }

        return $assignment->fresh();
    }
}
