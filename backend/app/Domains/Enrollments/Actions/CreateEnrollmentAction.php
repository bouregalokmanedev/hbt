<?php

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Domains\Enrollments\Services\EnrollmentService;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

final class CreateEnrollmentAction
{
    public function __construct(
        private EnrollmentRepositoryInterface $repository,
        private EnrollmentService $service,
    ) {
    }

    public function execute(
        int $userId,
        Course $course
    ): Enrollment {
        return DB::transaction(function () use (
    $userId,
    $course
) {
    $this->service->validateCourse($course);

    $existing = $this->repository
        ->findByUserAndCourse(
            $userId,
            $course->id
        );

    $this->service
        ->validateNotAlreadyEnrolled($existing);

    $enrollment = $this->repository->create([
        'user_id' => $userId,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
        'enrolled_at' => now(),
        'completed_at' => null,
        'cancelled_at' => null,
    ]);

    event(new EnrollmentCreated($enrollment));

    return $enrollment;
});
    }
    
}
