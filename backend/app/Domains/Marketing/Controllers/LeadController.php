<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Analytics\Models\AnalyticsEvent;
use App\Domains\Payments\Models\Order;
use App\Enums\LeadStatus;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\LeadActivity;
use App\Models\User;
use App\Services\Marketing\LeadScoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class LeadController extends Controller
{
    public function __construct(private readonly LeadScoreService $scoreService) {}

    /** Sales roster for lead assignment dropdowns. */
    public function team(): JsonResponse
    {
        $members = User::query()
            ->whereHas('roles', fn ($builder) => $builder->whereIn('name', ['Sales', 'Admin', 'Super Admin']))
            ->orderBy('first_name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->uuid,
                'name' => trim($user->first_name.' '.$user->last_name),
                'email' => $user->email,
            ]);

        return response()->json(['data' => $members]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = ContactMessage::query()->with('owner')->withCount('activities');

        if ($search = trim((string) $request->query('search', ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(fn ($builder) => $builder
                ->whereRaw('LOWER(email) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(first_name) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(subject) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(course_interest) LIKE ?', [$needle]));
        }
        if ($request->query('unread') === 'true') {
            $query->whereNull('read_at');
        }
        if ($request->query('converted') === 'true') {
            $query->whereNotNull('converted_at');
        }
        if ($statuses = array_filter(explode(',', (string) $request->query('status', '')))) {
            $query->whereIn('status', $statuses);
        }
        if ($ownerId = (string) $request->query('owner_id', '')) {
            $ownerId === 'none'
                ? $query->whereNull('owner_id')
                : $query->where('owner_id', $ownerId);
        }
        if ($source = (string) $request->query('source', '')) {
            $query->where('source', $source);
        }
        if ($request->query('due')) {
            $query->due((string) $request->query('due'));
        }
        if ($request->query('hot') === 'true') {
            $query->where('score', '>=', 70);
        }
        if ($minScore = $request->integer('min_score', 0)) {
            $query->where('score', '>=', $minScore);
        }

        $sort = (string) $request->query('sort', 'created_at');
        $sortColumn = match ($sort) {
            'score' => 'score',
            'next_follow_up_at' => 'next_follow_up_at',
            'status' => 'status',
            default => 'created_at',
        };
        $direction = $request->query('dir', 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortColumn, $direction)->orderBy('id', $direction);

        $leads = $query->paginate(min(max($request->integer('per_page', 20), 1), 200));

        return response()->json([
            'data' => $leads->getCollection()->map(fn (ContactMessage $lead) => $this->serialize($lead)),
            'meta' => [
                'current_page' => $leads->currentPage(),
                'last_page' => $leads->lastPage(),
                'per_page' => $leads->perPage(),
                'total' => $leads->total(),
            ],
            'summary' => $this->summary(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:3', 'max:5000'],
            'course_interest' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:50'],
            'owner_id' => ['nullable', 'uuid', 'exists:users,uuid'],
            'next_follow_up_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:'.implode(',', LeadStatus::pipeline())],
        ]);

        $lead = ContactMessage::create([
            ...$data,
            'source' => $data['source'] ?? 'manual',
            'status' => $data['status'] ?? LeadStatus::NEW->value,
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
        ]);

        $this->logActivity($lead, LeadActivity::TYPE_CREATED, $request->user()?->uuid);
        if ($lead->owner_id) {
            $this->logActivity($lead, LeadActivity::TYPE_ASSIGNED, $request->user()?->uuid);
        }

        return response()->json(['data' => $this->serialize($lead->load('owner'))], 201);
    }

    public function show(ContactMessage $lead): JsonResponse
    {
        $lead->load('owner');
        $this->scoreService->score($lead);

        $account = $this->matchAccount($lead);

        return response()->json([
            'data' => [
                ...$this->serialize($lead),
                'activities' => $lead->activities()
                    ->with('user:id,uuid,first_name,last_name')
                    ->latest()
                    ->limit(60)
                    ->get()
                    ->map(fn (LeadActivity $activity) => [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'body' => $activity->body,
                        'by' => $activity->user
                            ? trim($activity->user->first_name.' '.$activity->user->last_name)
                            : null,
                        'at' => $activity->created_at?->toISOString(),
                    ]),
                'journey' => $this->journey($lead, $account),
                'account' => $account
                    ? [
                        'id' => $account->uuid,
                        'name' => trim($account->first_name.' '.$account->last_name),
                        'email' => $account->email,
                        'avatar' => $account->avatar,
                        'created_at' => $account->created_at?->toISOString(),
                        'enrollments' => $account->enrollments_count ?? (int) $account->enrollments()->count(),
                        'paid_total' => (int) Order::query()->where('user_id', $account->id)->where('status', 'paid')->sum('total'),
                    ]
                    : null,
            ],
        ]);
    }

    public function update(Request $request, ContactMessage $lead): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:'.implode(',', LeadStatus::pipeline())],
            'owner_id' => ['nullable', 'uuid', 'exists:users,uuid'],
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'email' => ['sometimes', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['sometimes', 'string', 'max:255'],
            'message' => ['sometimes', 'string', 'min:3', 'max:5000'],
            'course_interest' => ['nullable', 'string', 'max:255'],
            'next_follow_up_at' => ['nullable', 'date'],
            'lost_reason' => ['nullable', 'string', 'max:100'],
        ]);

        $actor = $request->user()?->uuid;

        if (isset($data['status']) && $lead->status?->value !== $data['status']) {
            $next = LeadStatus::from($data['status']);
            $lead->closed_at = $next->isClosed() ? ($lead->closed_at ?? now()) : null;
            if ($next !== LeadStatus::LOST) {
                $lead->lost_reason = null;
            }
            $this->logActivity(
                $lead,
                LeadActivity::TYPE_STAGE,
                $actor,
                ($lead->status?->value ?? 'new').' → '.$next->value,
            );
        }

        if (array_key_exists('owner_id', $data) && $data['owner_id'] !== $lead->owner_id) {
            $this->logActivity($lead, LeadActivity::TYPE_ASSIGNED, $actor);
        }

        if (array_key_exists('next_follow_up_at', $data) && $data['next_follow_up_at'] !== null) {
            $this->logActivity($lead, LeadActivity::TYPE_FOLLOW_UP, $actor, (string) $data['next_follow_up_at']);
        }

        $lead->fill($data);
        $lead->read_at = $lead->read_at ?? now();
        $lead->save();

        return response()->json(['data' => $this->serialize($lead->load('owner')->loadCount('activities'))]);
    }

    public function destroy(ContactMessage $lead): JsonResponse
    {
        $lead->delete();

        return response()->json(['success' => true]);
    }

    public function read(ContactMessage $lead): JsonResponse
    {
        $lead->update(['read_at' => $lead->read_at ?? now()]);

        return response()->json(['data' => $this->serialize($lead->fresh()->load('owner'))]);
    }

    public function storeActivity(Request $request, ContactMessage $lead): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:'.implode(',', [
                LeadActivity::TYPE_NOTE,
                LeadActivity::TYPE_CALL,
                LeadActivity::TYPE_EMAIL,
                LeadActivity::TYPE_WHATSAPP,
            ])],
            'body' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        $activity = $lead->activities()->create([
            ...$data,
            'user_id' => $request->user()?->uuid,
        ]);

        return response()->json([
            'data' => [
                'id' => $activity->id,
                'type' => $activity->type,
                'body' => $activity->body,
                'by' => $request->user() ? trim($request->user()->first_name.' '.$request->user()->last_name) : null,
                'at' => $activity->created_at?->toISOString(),
            ],
        ], 201);
    }

    /** CSV export of the current filter — backs the Sales Sheet download. */
    public function export(Request $request): StreamedResponse
    {
        $query = $this->filteredQuery($request);

        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'id', 'created_at', 'name', 'email', 'phone', 'status', 'score',
            'source', 'course_interest', 'owner', 'next_follow_up_at',
            'converted', 'subject', 'utm_source', 'utm_medium', 'utm_campaign',
        ], ',');

        $query->chunkById(500, function ($leads) use ($handle) {
            foreach ($leads as $lead) {
                fputcsv($handle, [
                    $lead->id,
                    $lead->created_at?->toDateTimeString(),
                    $lead->full_name,
                    $lead->email,
                    $lead->phone,
                    $lead->status?->value,
                    $lead->score,
                    $lead->source,
                    $lead->course_interest,
                    $lead->owner ? trim($lead->owner->first_name.' '.$lead->owner->last_name) : '',
                    $lead->next_follow_up_at?->toDateTimeString(),
                    $lead->converted_at ? 'yes' : 'no',
                    $lead->subject,
                    $lead->utm_source,
                    $lead->utm_medium,
                    $lead->utm_campaign,
                ], ',');
            }
        });

        rewind($handle);

        return response()->streamDownload(function () use ($handle) {
            fpassthru($handle);
            fclose($handle);
        }, 'leads-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /** Bulk CSV import for the Sales Sheet: header row + one lead per line. */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048'],
        ]);

        $rows = array_map('str_getcsv', file($request->file('file')->getRealPath()));
        $header = array_map(fn ($column) => mb_strtolower(trim($column, " \t\n\r\0\x0B\"")), array_shift($rows) ?: []);

        $created = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            if ($row === [null] || trim(implode('', array_map('strval', $row))) === '') {
                continue;
            }
            $record = array_combine($header, $row) ?: [];
            $email = mb_strtolower(trim((string) ($record['email'] ?? '')));
            if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped++;

                continue;
            }
            $exists = ContactMessage::query()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->where('created_at', '>=', now()->subDays(30))
                ->exists();
            if ($exists) {
                $skipped++;

                continue;
            }

            ContactMessage::create([
                'first_name' => mb_substr(trim((string) ($record['first_name'] ?? $email)), 0, 100) ?: 'Imported',
                'last_name' => mb_substr(trim((string) ($record['last_name'] ?? '')), 0, 100) ?: null,
                'email' => $email,
                'phone' => mb_substr(trim((string) ($record['phone'] ?? '')), 0, 50) ?: null,
                'subject' => mb_substr(trim((string) ($record['subject'] ?? 'Imported lead')), 0, 255),
                'message' => mb_substr(trim((string) ($record['message'] ?? 'Imported from CSV.')), 0, 5000),
                'course_interest' => mb_substr(trim((string) ($record['course_interest'] ?? '')), 0, 255) ?: null,
                'source' => mb_substr(trim((string) ($record['source'] ?? 'import')), 0, 50),
                'status' => in_array($record['status'] ?? '', LeadStatus::pipeline(), true) ? $record['status'] : LeadStatus::NEW->value,
            ]);
            $created++;
        }

        return response()->json([
            'success' => true,
            'message' => "Imported {$created} leads, skipped {$skipped}.",
            'data' => ['created' => $created, 'skipped' => $skipped],
        ]);
    }

    /**
     * Public lead capture (newsletter, landing forms). No account needed:
     * the browser's visitor_id stitches this email to later behaviour.
     */
    public function capture(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:100'],
            'visitor_id' => ['nullable', 'uuid'],
            'course_interest' => ['nullable', 'string', 'max:255'],
            'utm_source' => ['nullable', 'string', 'max:100'],
            'utm_medium' => ['nullable', 'string', 'max:100'],
            'utm_campaign' => ['nullable', 'string', 'max:100'],
            'utm_term' => ['nullable', 'string', 'max:100'],
            'utm_content' => ['nullable', 'string', 'max:100'],
        ]);

        $existing = ContactMessage::query()
            ->where('email', $data['email'])
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if ($existing) {
            return response()->json(['success' => true, 'message' => 'Already subscribed.', 'data' => ['id' => $existing->id]]);
        }

        $lead = ContactMessage::create([
            'first_name' => $data['first_name'] ?? 'Website',
            'last_name' => 'Visitor',
            'email' => $data['email'],
            'inquiry' => 'newsletter',
            'subject' => 'Newsletter signup'.($data['source'] ? " ({$data['source']})" : ''),
            'message' => 'Subscribed via '.($data['source'] ?? 'website').'.',
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 512),
            'visitor_id' => $data['visitor_id'] ?? null,
            'source' => 'newsletter',
            'course_interest' => $data['course_interest'] ?? null,
            'utm_source' => $data['utm_source'] ?? null,
            'utm_medium' => $data['utm_medium'] ?? null,
            'utm_campaign' => $data['utm_campaign'] ?? null,
            'utm_term' => $data['utm_term'] ?? null,
            'utm_content' => $data['utm_content'] ?? null,
        ]);

        return response()->json(['success' => true, 'message' => 'Subscribed.', 'data' => ['id' => $lead->id]], 201);
    }

    private function filteredQuery(Request $request)
    {
        $query = ContactMessage::query()->with('owner');

        if ($search = trim((string) $request->query('search', ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(fn ($builder) => $builder
                ->whereRaw('LOWER(email) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(first_name) LIKE ?', [$needle])
                ->orWhereRaw('LOWER(subject) LIKE ?', [$needle]));
        }
        if ($statuses = array_filter(explode(',', (string) $request->query('status', '')))) {
            $query->whereIn('status', $statuses);
        }
        if ($ownerId = (string) $request->query('owner_id', '')) {
            $ownerId === 'none'
                ? $query->whereNull('owner_id')
                : $query->where('owner_id', $ownerId);
        }
        if ($source = (string) $request->query('source', '')) {
            $query->where('source', $source);
        }
        if ($request->query('due')) {
            $query->due((string) $request->query('due'));
        }

        return $query->orderBy('id');
    }

    private function summary(): array
    {
        $base = fn () => ContactMessage::query();

        return [
            'total' => $base()->count(),
            'unread' => $base()->whereNull('read_at')->count(),
            'converted' => $base()->whereNotNull('converted_at')->count(),
            'by_stage' => ContactMessage::query()
                ->selectRaw('status, COUNT(*) AS total')
                ->groupBy('status')
                ->pluck('total', 'status')
                ->union(array_fill_keys(LeadStatus::pipeline(), 0))
                ->all(),
            'due_today' => $base()->due('today')->count(),
            'overdue' => $base()->due('overdue')->count(),
            'hot' => $base()->where('score', '>=', 70)
                ->whereNotIn('status', [LeadStatus::WON->value, LeadStatus::LOST->value])
                ->count(),
            'won_30d' => $base()->where('status', LeadStatus::WON->value)
                ->where('closed_at', '>=', now()->subDays(30))
                ->count(),
            'sources' => ContactMessage::query()
                ->selectRaw("COALESCE(source, 'unknown') AS source, COUNT(*) AS total")
                ->groupBy('source')
                ->orderByDesc('total')
                ->take(8)
                ->get(),
        ];
    }

    /** Behavioural trail for the lead's browser + matched account, newest first. */
    private function journey(ContactMessage $lead, ?User $account): array
    {
        $visitorIds = array_values(array_unique(array_filter(array_merge(
            [$lead->visitor_id],
            $this->scoreServiceVisitorIds($lead),
        ))));

        return AnalyticsEvent::query()
            ->where(function ($query) use ($visitorIds, $account) {
                $query->when(
                    $visitorIds !== [],
                    fn ($builder) => $builder->whereIn('visitor_id', $visitorIds),
                );
                if ($account) {
                    $query->orWhere('user_id', $account->id);
                }
            })
            ->where('created_at', '>=', now()->subDays(90))
            ->latest()
            ->limit(40)
            ->get()
            ->map(fn (AnalyticsEvent $event) => [
                'event' => $event->event,
                'page' => $event->page,
                'country' => $event->country,
                'properties' => $event->properties,
                'at' => $event->created_at?->toISOString(),
            ])
            ->all();
    }

    /**
     * @return list<string>
     */
    private function scoreServiceVisitorIds(ContactMessage $lead): array
    {
        $needle = mb_strtolower((string) $lead->email);

        return ContactMessage::query()
            ->whereRaw('LOWER(email) = ?', [$needle])
            ->whereNotNull('visitor_id')
            ->pluck('visitor_id')
            ->concat(
                AnalyticsEvent::query()
                    ->whereNotNull('visitor_id')
                    ->whereIn('user_id', fn ($sub) => $sub
                        ->select('id')
                        ->from('users')
                        ->whereRaw('LOWER(email) = ?', [$needle]))
                    ->distinct()
                    ->pluck('visitor_id')
            )
            ->unique()
            ->values()
            ->all();
    }

    private function matchAccount(ContactMessage $lead): ?User
    {
        if (! $lead->email) {
            return null;
        }

        return User::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($lead->email)])
            ->withCount('enrollments')
            ->first();
    }

    private function logActivity(ContactMessage $lead, string $type, ?string $userId, ?string $body = null): void
    {
        $lead->activities()->create([
            'type' => $type,
            'body' => $body,
            'user_id' => $userId,
        ]);
    }

    private function serialize(ContactMessage $lead): array
    {
        return [
            'id' => $lead->id,
            'name' => $lead->full_name,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'inquiry' => $lead->inquiry,
            'subject' => $lead->subject,
            'message' => $lead->message,
            'status' => $lead->status?->value ?? LeadStatus::NEW->value,
            'score' => (int) $lead->score,
            'source' => $lead->source,
            'course_interest' => $lead->course_interest,
            'owner' => $lead->owner
                ? [
                    'id' => $lead->owner->uuid,
                    'name' => trim($lead->owner->first_name.' '.$lead->owner->last_name),
                    'email' => $lead->owner->email,
                ]
                : null,
            'utm' => [
                'source' => $lead->utm_source,
                'medium' => $lead->utm_medium,
                'campaign' => $lead->utm_campaign,
                'term' => $lead->utm_term,
                'content' => $lead->utm_content,
            ],
            'next_follow_up_at' => $lead->next_follow_up_at?->toISOString(),
            'closed_at' => $lead->closed_at?->toISOString(),
            'lost_reason' => $lead->lost_reason,
            'overdue' => $lead->isOverdue(),
            'converted' => $lead->converted_at !== null,
            'read' => $lead->read_at !== null,
            'activities_count' => (int) ($lead->activities_count ?? $lead->activities()->count()),
            'created_at' => $lead->created_at?->toISOString(),
        ];
    }
}
