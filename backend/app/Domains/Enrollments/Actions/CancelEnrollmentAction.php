<?php

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Services\EnrollmentService;
use App\Domains\Enrollments\Events\EnrollmentCancelled;
use App\Enums\EnrollmentStatus;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

final class CancelEnrollmentAction
{
    public function __construct(
        private EnrollmentRepositoryInterface $repository,
        private EnrollmentService $service,
    ) {
    }

    public function execute(
        Enrollment $enrollment
    ): Enrollment {
        return DB::transaction(function () use ($enrollment) {
            $this->service
                ->validateCanCancel($enrollment);

            $enrollment = $this->repository->update(
    $enrollment,
    [
        'status' => EnrollmentStatus::CANCELLED,
        'cancelled_at' => now(),
        'completed_at' => null,
    ]
);

event(new EnrollmentCancelled($enrollment));

return $enrollment;
        });
    }
}
