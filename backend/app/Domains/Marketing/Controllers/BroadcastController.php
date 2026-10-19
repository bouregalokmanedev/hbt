<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Admin\Services\AdminBroadcastService;
use App\Domains\Notifications\Models\AdminBroadcast;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class BroadcastController extends Controller
{
    /**
     * Marketers see their own broadcasts (staff-wide comms stay admin-only).
     */
    public function index(Request $request): JsonResponse
    {
        $broadcasts = AdminBroadcast::query()
            ->where('admin_id', $request->user()->id)
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $broadcasts->getCollection()->map(fn (AdminBroadcast $broadcast) => [
                'id' => $broadcast->id,
                'audience' => $broadcast->audience,
                'title' => $broadcast->title,
                'created_at' => $broadcast->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $broadcasts->currentPage(),
                'last_page' => $broadcasts->lastPage(),
                'total' => $broadcasts->total(),
            ],
        ]);
    }

    /**
     * Marketing audiences only: staff-wide and hand-picked sends stay
     * admin-only so marketers can't message other staff at will.
     */
    public function store(Request $request, AdminBroadcastService $broadcasts): JsonResponse
    {
        $data = $request->validate([
            'audience' => ['required', Rule::in(['all', 'students', 'instructors'])],
            'type' => ['nullable', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'replies_enabled' => ['nullable', 'boolean'],
            'quick_replies' => ['nullable', 'array', 'max:4'],
            'quick_replies.*' => ['string', 'max:100'],
        ]);

        $data['type'] ??= 'promotion';

        $broadcast = $broadcasts->send($request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Broadcast sent.',
            'data' => ['id' => $broadcast->id],
        ], 201);
    }
}
