<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\Models\Assignment;

final class DeleteAssignmentAction
{
    public function execute(Assignment $assignment): void
    {
        $assignment->delete();
    }
}
