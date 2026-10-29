<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Assignments\Actions\SubmitAssignmentAction;
use App\Domains\Assignments\DTOs\SubmitAssignmentData;
use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Courses\Services\CourseAccessService;
use App\Enums\EnrollmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Assignments\LearnerAssignmentResource;
use App\Http\Resources\Api\V1\Assignments\LearnerSubmissionResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AssignmentController extends Controller
{
    public function __construct(
        private readonly CourseAccessService $access,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = min(max($request->integer('limit', 10), 1), 50);

        $courseIds = $user->enrollments()
            ->whereIn('status', [
                EnrollmentStatus::ACTIVE->value,
                EnrollmentStatus::COMPLETED->value,
            ])
            ->pluck('course_id');

        $assignments = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->where('status', AssignmentStatus::PUBLISHED->value)
            ->with([
                'course:id,title',
                'submissions' => fn ($query) => $query->where('user_id', $user->id),
            ])
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => LearnerAssignmentResource::collection($assignments),
        ]);
    }

    public function courseAssignments(Request $request, Course $course): JsonResponse
    {
        $user = $this->authorizeLearner($request, $course);

        $assignments = Assignment::query()
            ->where('course_id', $course->id)
            ->where('status', AssignmentStatus::PUBLISHED->value)
            ->with([
                'submissions' => fn ($query) => $query->where('user_id', $user->id),
            ])
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->get();

        return response()->json([
            'data' => LearnerAssignmentResource::collection($assignments),
        ]);
    }

    public function show(
        Request $request,
        Course $course,
        Assignment $assignment,
    ): JsonResponse {
        $user = $this->authorizeLearner($request, $course);
        $this->authorizeAssignment($course, $assignment);

        $assignment->load([
            'submissions' => fn ($query) => $query->where('user_id', $user->id),
        ]);

        return response()->json([
            'data' => new LearnerAssignmentResource($assignment),
        ]);
    }

    public function submit(
        Request $request,
        Course $course,
        Assignment $assignment,
        SubmitAssignmentAction $action,
    ): JsonResponse {
        $user = $this->authorizeLearner($request, $course);
        $this->authorizeAssignment($course, $assignment);

        $data = $request->validate([
            'content' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'link_url' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
        ]);

        $submission = $action->execute(
            $assignment,
            $user,
            SubmitAssignmentData::fromArray($data),
        );

        $submission->load('assignment');

        return response()->json([
            'data' => new LearnerSubmissionResource($submission),
        ]);
    }

    private function authorizeLearner(Request $request, Course $course)
    {
        $user = $request->user();

        abort_unless(
            $this->access->hasFullAccess($user, $course),
            403,
            'You must be enrolled in this course to view its assignments.',
        );

        return $user;
    }

    private function authorizeAssignment(Course $course, Assignment $assignment): void
    {
        abort_unless($assignment->course_id === $course->id, 404);
        abort_unless($assignment->isPublished(), 404);
    }
}
