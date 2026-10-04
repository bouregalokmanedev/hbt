<?php

namespace App\Domains\Enrollments\Actions;

use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Domains\Enrollments\Services\EnrollmentService;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
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

    $student = User::query()->find($userId);
    if ($student !== null) {
        app(\App\Domains\Progression\Services\StudentProgressionService::class)->award(
            $student,
            'course_enrolled',
            15,
            25,
            "enrollment:{$enrollment->id}",
            ['course' => $course->title, 'label' => 'Course enrolled'],
        );
    }

    $instructor = $course->instructor;
    if ($instructor !== null) {
        app(\App\Domains\Progression\Services\InstructorProgressionService::class)->award(
            $instructor,
            'student_enrolled',
            10,
            20,
            "enrollment:{$enrollment->id}",
            ['label' => 'Student enrolled', 'course' => $course->title],
        );
    }

    return $enrollment;
});
    }
    
}
