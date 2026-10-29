<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Assignments\Actions\CreateAssignmentAction;
use App\Domains\Assignments\Actions\DeleteAssignmentAction;
use App\Domains\Assignments\Actions\GradeAssignmentSubmissionAction;
use App\Domains\Assignments\Actions\PublishAssignmentAction;
use App\Domains\Assignments\Actions\UnpublishAssignmentAction;
use App\Domains\Assignments\Actions\UpdateAssignmentAction;
use App\Domains\Assignments\DTOs\CreateAssignmentData;
use App\Domains\Assignments\DTOs\GradeAssignmentSubmissionData;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Instructor\InstructorAssignmentResource;
use App\Http\Resources\Api\V1\Instructor\InstructorAssignmentSubmissionResource;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class InstructorAssignmentController extends Controller
{
    public function __construct(
        private readonly CreateAssignmentAction $createAction,
        private readonly UpdateAssignmentAction $updateAction,
        private readonly DeleteAssignmentAction $deleteAction,
        private readonly PublishAssignmentAction $publishAction,
        private readonly UnpublishAssignmentAction $unpublishAction,
        private readonly GradeAssignmentSubmissionAction $gradeAction,
    ) {
    }

    public function index(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourse($request, $course);

        $assignments = Assignment::query()
            ->where('course_id', $course->id)
            ->when(
                $request->filled('search'),
                fn ($query, $search) => $query->where(
                    'title',
                    'like',
                    '%'.$request->string('search')->toString().'%',
                ),
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'status',
                    $request->string('status')->toString(),
                ),
            )
            ->withCount([
                'submissions',
                'submissions as graded_count' => fn ($query) => $query->where('status', 'graded'),
                'submissions as pending_count' => fn ($query) => $query->where('status', 'submitted'),
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => InstructorAssignmentResource::collection($assignments),
        ]);
    }

    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorizeCourse($request, $course);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'instructions' => ['required', 'string', 'max:20000'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'max_points' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'allow_late_submissions' => ['sometimes', 'boolean'],
        ]);

        $assignment = $this->createAction->execute(
            $course,
            CreateAssignmentData::fromArray($data),
        );

        return response()->json([
            'data' => new InstructorAssignmentResource($assignment),
        ], 201);
    }

    public function show(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorizeAssignment($request, $assignment);

        $assignment->loadCount([
            'submissions',
            'submissions as graded_count' => fn ($query) => $query->where('status', 'graded'),
            'submissions as pending_count' => fn ($query) => $query->where('status', 'submitted'),
        ]);

        return response()->json([
            'data' => new InstructorAssignmentResource($assignment),
        ]);
    }

    public function update(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorizeAssignment($request, $assignment);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'instructions' => ['sometimes', 'required', 'string', 'max:20000'],
            'due_at' => ['sometimes', 'nullable', 'date'],
            'max_points' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'allow_late_submissions' => ['sometimes', 'boolean'],
        ]);

        $assignment = $this->updateAction->execute($assignment, $data);

        return response()->json([
            'data' => new InstructorAssignmentResource($assignment),
        ]);
    }

    public function destroy(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorizeAssignment($request, $assignment);

        $this->deleteAction->execute($assignment);

        return response()->json(status: 204);
    }

    public function publish(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorizeAssignment($request, $assignment);

        $assignment = $this->publishAction->execute($assignment);

        return response()->json([
            'data' => new InstructorAssignmentResource($assignment),
        ]);
    }

    public function unpublish(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorizeAssignment($request, $assignment);

        $assignment = $this->unpublishAction->execute($assignment);

        $assignment->loadCount('submissions');

        return response()->json([
            'data' => new InstructorAssignmentResource($assignment),
        ]);
    }

    public function submissions(Request $request, Assignment $assignment): JsonResponse
    {
        $this->authorizeAssignment($request, $assignment);

        $submissions = $assignment->submissions()
            ->with(['student', 'assignment'])
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json([
            'data' => InstructorAssignmentSubmissionResource::collection($submissions),
        ]);
    }

    public function grade(
        Request $request,
        Assignment $assignment,
        AssignmentSubmission $submission,
    ): JsonResponse {
        $this->authorizeAssignment($request, $assignment);

        abort_unless(
            $submission->assignment_id === $assignment->id,
            404,
        );

        $data = $request->validate([
            'grade' => ['required', 'numeric', 'min:0', 'max:'.$assignment->max_points],
            'feedback' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $submission = $this->gradeAction->execute(
            $submission,
            $request->user(),
            GradeAssignmentSubmissionData::fromArray($data),
        );

        return response()->json([
            'data' => new InstructorAssignmentSubmissionResource($submission),
        ]);
    }

    private function authorizeCourse(Request $request, Course $course): void
    {
        abort_unless($request->user()?->can('update', $course), 403);
    }

    private function authorizeAssignment(Request $request, Assignment $assignment): void
    {
        $assignment->loadMissing('course');
        $this->authorizeCourse($request, $assignment->course);
    }
}
