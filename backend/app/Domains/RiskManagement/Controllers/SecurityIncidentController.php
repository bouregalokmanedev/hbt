<?php

namespace App\Domains\RiskManagement\Controllers;

use App\Domains\RiskManagement\Actions\CreateSecurityIncidentAction;
use App\Domains\RiskManagement\Models\SecurityIncident;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityIncidentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SecurityIncident::class);

        $incidents = SecurityIncident::with(['reporter:id,first_name,last_name', 'assignee:id,first_name,last_name'])
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $incidents->getCollection()->map(fn (SecurityIncident $i) => [
                'id' => $i->id,
                'incident_number' => $i->incident_number,
                'title' => $i->title,
                'severity' => $i->severity,
                'status' => $i->status,
                'assignee' => $i->assignee?->full_name,
                'detected_at' => $i->detected_at?->toISOString(),
                'created_at' => $i->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $incidents->currentPage(),
                'last_page' => $incidents->lastPage(),
                'per_page' => $incidents->perPage(),
                'total' => $incidents->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function store(Request $request, CreateSecurityIncidentAction $create): JsonResponse
    {
        $this->authorize('create', SecurityIncident::class);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'string', 'max:50'],
            'severity' => ['required', 'string', 'in:low,medium,high,critical'],
            'impact' => ['nullable', 'string'],
        ]);

        $incident = $create->execute($data, $request->user()->id, $request->user()->tenant_id);

        return response()->json(['success' => true, 'message' => 'Incident created.', 'data' => ['id' => $incident->id, 'incident_number' => $incident->incident_number]], 201);
    }

    public function show(SecurityIncident $securityIncident): JsonResponse
    {
        $this->authorize('view', $securityIncident);
        $securityIncident->load(['reporter:id,first_name,last_name', 'assignee:id,first_name,last_name', 'events.user:id,first_name,last_name']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $securityIncident->id,
                'incident_number' => $securityIncident->incident_number,
                'title' => $securityIncident->title,
                'description' => $securityIncident->description,
                'severity' => $securityIncident->severity,
                'status' => $securityIncident->status,
                'assignee' => $securityIncident->assignee?->full_name,
                'events' => $securityIncident->events->map(fn ($e) => [
                    'event' => $e->event,
                    'description' => $e->description,
                    'user' => $e->user?->full_name,
                    'created_at' => $e->created_at?->toISOString(),
                ]),
            ],
        ]);
    }

    public function assign(Request $request, SecurityIncident $securityIncident): JsonResponse
    {
        $this->authorize('update', $securityIncident);
        $data = $request->validate(['assignee_id' => ['required', 'integer', 'exists:users,id']]);
        $securityIncident->update(['assigned_to' => $data['assignee_id']]);
        $securityIncident->events()->create(['user_id' => $request->user()->id, 'event' => 'assigned', 'description' => 'Assigned to user '.$data['assignee_id']]);

        return response()->json(['success' => true, 'message' => 'Incident assigned.']);
    }

    public function escalate(Request $request, SecurityIncident $securityIncident): JsonResponse
    {
        $this->authorize('update', $securityIncident);
        $severityOrder = ['low' => 0, 'medium' => 1, 'high' => 2, 'critical' => 3];
        $current = $severityOrder[$securityIncident->severity] ?? 1;
        $next = array_search($current + 1, $severityOrder) ?: 'high';
        if ($securityIncident->severity === 'critical') {
            return response()->json(['success' => false, 'message' => 'Already critical.'], 422);
        }
        $levels = ['low', 'medium', 'high', 'critical'];
        $nextLevel = $levels[min($current + 1, 3)];
        $securityIncident->update(['severity' => $nextLevel]);
        $securityIncident->events()->create(['user_id' => $request->user()->id, 'event' => 'escalated', 'description' => "Escalated to {$nextLevel}"]);

        return response()->json(['success' => true, 'message' => "Escalated to {$nextLevel}."]);
    }

    public function resolve(Request $request, SecurityIncident $securityIncident): JsonResponse
    {
        $this->authorize('update', $securityIncident);
        $data = $request->validate(['resolution' => ['required', 'string'], 'lessons_learned' => ['nullable', 'string']]);
        $securityIncident->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolution' => $data['resolution'],
            'lessons_learned' => $data['lessons_learned'] ?? null,
        ]);
        $securityIncident->events()->create(['user_id' => $request->user()->id, 'event' => 'resolved', 'description' => $data['resolution']]);

        return response()->json(['success' => true, 'message' => 'Incident resolved.']);
    }

    public function dashboard(): JsonResponse
    {
        $this->authorize('viewAny', SecurityIncident::class);

        return response()->json([
            'success' => true,
            'data' => [
                'open' => SecurityIncident::where('status', 'open')->count(),
                'acknowledged' => SecurityIncident::where('status', 'acknowledged')->count(),
                'resolved' => SecurityIncident::where('status', 'resolved')->count(),
                'critical' => SecurityIncident::where('severity', 'critical')->where('status', '!=', 'closed')->count(),
                'recent' => SecurityIncident::latest()->limit(5)->get(['id', 'incident_number', 'title', 'severity', 'status'])->toArray(),
            ],
        ]);
    }
}
