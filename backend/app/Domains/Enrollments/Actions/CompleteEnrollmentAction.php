<?php

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Events\EnrollmentCompleted;
use App\Domains\Enrollments\Services\EnrollmentService;
use App\Enums\EnrollmentStatus;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

final class CompleteEnrollmentAction
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
                ->validateCanComplete($enrollment);

            $enrollment = $this->repository->update(
    $enrollment,
    [
        'status' => EnrollmentStatus::COMPLETED,
        'completed_at' => now(),
        'cancelled_at' => null,
    ]
);

event(new EnrollmentCompleted($enrollment));

return $enrollment;
        });
    }
}
