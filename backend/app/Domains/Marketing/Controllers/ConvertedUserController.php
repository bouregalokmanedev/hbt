<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Payments\Models\Order;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * "Who we won": registered learners joined with enrolments, paid revenue and
 * the lead source that brought them (email match against captured leads).
 */
final class ConvertedUserController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = User::query()
            ->whereHas('roles', fn ($builder) => $builder->where('name', 'Student'))
            ->withCount('enrollments')
            ->orderByDesc('created_at');

        if ($search = trim((string) $request->query('search', ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(fn ($builder) => $builder
                ->whereRaw('LOWER(email) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(first_name) LIKE ?', [$needle]));
        }
        if ($source = (string) $request->query('source', '')) {
            $leadEmails = ContactMessage::query()
                ->where('source', $source)
                ->whereNotNull('converted_at')
                ->pluck('email')
                ->map(fn (string $email) => mb_strtolower($email))
                ->unique()
                ->values();
            $query->whereIn(DB::raw('LOWER(email)'), $leadEmails);
        }

        $users = $query->paginate(min(max($request->integer('per_page', 20), 1), 100));

        $rows = $users->getCollection()->map(function (User $user) {
            $lead = ContactMessage::query()
                ->whereRaw('LOWER(email) = ?', [mb_strtolower($user->email)])
                ->orderBy('created_at')
                ->first();

            $firstEnrollment = Enrollment::query()
                ->where('user_id', $user->id)
                ->with('course:id,title')
                ->orderBy('created_at')
                ->first();

            return [
                'id' => $user->uuid,
                'name' => trim($user->first_name.' '.$user->last_name),
                'email' => $user->email,
                'avatar' => $user->avatar,
                'country' => $user->country,
                'joined_at' => $user->created_at?->toISOString(),
                'source' => $lead?->source,
                'course_interest' => $lead?->course_interest,
                'lead_status' => $lead?->status?->value,
                'enrollments' => (int) $user->enrollments_count,
                'first_course' => $firstEnrollment?->course?->title,
                'paid_total' => (int) Order::query()->where('user_id', $user->id)->where('status', 'paid')->sum('total'),
            ];
        });

        return response()->json([
            'data' => $rows,
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }
}
