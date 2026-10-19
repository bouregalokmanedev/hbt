<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Support\Enums\TicketStatus;
use App\Domains\Support\Models\SupportTicket;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only student lookup for the Support desk. Support answers tickets
 * blind today — this gives them the account context they need (enrollments,
 * certificates, open tickets, last activity) without touching any write path.
 *
 * Route middleware (role:Support|Admin|Super Admin) is the gate; the User
 * policy intentionally stays Admin-only for write operations.
 */
class SupportStudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $query = User::query()
            ->whereHas('roles', fn (Builder $roles) => $roles->where('name', UserRole::STUDENT->value));

        if ($search !== '') {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function (Builder $builder) use ($needle): void {
                $builder->whereRaw('LOWER(first_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            });
        }

        $students = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $students->getCollection()->map(function (User $student): array {
            $enrollments = Enrollment::query()->where('user_id', $student->id);
            $certificates = Certificate::query()->where('user_id', $student->id);
            $lastActive = CourseProgress::query()->where('user_id', $student->id)->max('updated_at');
            $openTickets = SupportTicket::query()
                ->where('user_id', $student->id)
                ->whereIn('status', [TicketStatus::OPEN->value, TicketStatus::PENDING->value])
                ->count();

            return [
                'id' => $student->uuid,
                'name' => $student->full_name,
                'email' => $student->email,
                'status' => $student->status,
                'verified' => $student->hasVerifiedEmail(),
                'enrollments_count' => (clone $enrollments)->count(),
                'completed_count' => (clone $enrollments)->where('status', 'completed')->count(),
                'certificates_count' => $certificates->count(),
                'open_tickets' => $openTickets,
                'last_active_at' => $lastActive,
                'joined_at' => $student->created_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function show(Request $request, string $student): JsonResponse
    {
        $model = User::query()
            ->where('uuid', $student)
            ->whereHas('roles', fn (Builder $roles) => $roles->where('name', UserRole::STUDENT->value))
            ->firstOrFail();

        $enrollments = Enrollment::query()
            ->with('course:id,title,status')
            ->where('user_id', $model->id)
            ->latest()
            ->get()
            ->map(function (Enrollment $enrollment) use ($model): array {
                $course = $enrollment->course;
                $progress = CourseProgress::query()
                    ->where('user_id', $model->id)
                    ->where('course_id', $enrollment->course_id)
                    ->first();

                return [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status instanceof \BackedEnum ? $enrollment->status->value : (string) $enrollment->status,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                    'course' => $course ? [
                        'id' => $course->id,
                        'title' => $course->title,
                        'status' => $course->status instanceof \BackedEnum ? $course->status->value : (string) $course->status,
                    ] : null,
                    'progress_percentage' => $progress?->progress_percentage ?? 0,
                    'time_spent' => $progress?->time_spent ?? 0,
                ];
            });

        $certificates = Certificate::query()
            ->where('user_id', $model->id)
            ->latest('issued_at')
            ->get(['id', 'certificate_number', 'course_title', 'issued_at'])
            ->map(fn (Certificate $certificate) => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'course_title' => $certificate->course_title,
                'issued_at' => $certificate->issued_at?->toISOString(),
            ]);

        $tickets = SupportTicket::query()
            ->where('user_id', $model->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (SupportTicket $ticket) => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'category' => $ticket->category,
                'status' => $ticket->status->value,
                'priority' => $ticket->priority->value,
                'overdue' => $ticket->isOverdue(),
                'created_at' => $ticket->created_at?->toISOString(),
            ]);

        $openTickets = $tickets->filter(
            fn (array $ticket) => in_array($ticket['status'], [TicketStatus::OPEN->value, TicketStatus::PENDING->value], true),
        )->count();

        return response()->json([
            'success' => true,
            'message' => 'Student retrieved.',
            'data' => [
                'id' => $model->uuid,
                'name' => $model->full_name,
                'email' => $model->email,
                'status' => $model->status,
                'verified' => $model->hasVerifiedEmail(),
                'joined_at' => $model->created_at?->toISOString(),
                'last_active_at' => CourseProgress::query()->where('user_id', $model->id)->max('updated_at'),
                'summary' => [
                    'enrollments' => $enrollments->count(),
                    'completed' => $enrollments->filter(
                        fn (array $item) => $item['status'] === 'completed',
                    )->count(),
                    'certificates' => $certificates->count(),
                    'open_tickets' => $openTickets,
                ],
                'enrollments' => $enrollments,
                'certificates' => $certificates,
                'tickets' => $tickets,
            ],
        ]);
    }
}
