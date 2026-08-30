<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminBroadcastQuery;
use App\Domains\Admin\Resources\AdminBroadcastResource;
use App\Domains\Admin\Services\AdminBroadcastService;
use App\Domains\Notifications\Models\AdminBroadcast;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class AdminNotificationController extends Controller
{
    public function index(Request $request)
    {
        return AdminBroadcastResource::collection(
            app(AdminBroadcastQuery::class)->paginate(
                $request->integer('per_page', 20),
            )
        );
    }

    public function broadcast(Request $request, AdminBroadcastService $broadcasts): AdminBroadcastResource
    {
        $data = $request->validate([
            'audience' => ['required', Rule::in(['all', 'students', 'instructors', 'selected'])],
            'recipient_ids' => ['required_if:audience,selected', 'array', 'max:1000'],
            'recipient_ids.*' => ['uuid'],
            'type' => ['nullable', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'replies_enabled' => ['nullable', 'boolean'],
            'quick_replies' => ['nullable', 'array', 'max:4'],
            'quick_replies.*' => ['string', 'max:100'],
        ]);

        $data['type'] ??= 'announcement';

        return new AdminBroadcastResource(
            $broadcasts->send($request->user(), $data)
        );
    }

    public function show(AdminBroadcast $broadcast): AdminBroadcastResource
    {
        $broadcast->load('administrator:id,uuid,first_name,last_name,email');
        $broadcast->setAttribute(
            'read_count',
            app(AdminBroadcastQuery::class)->readCount($broadcast),
        );

        return new AdminBroadcastResource($broadcast);
    }
}
