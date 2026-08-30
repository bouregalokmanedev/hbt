<?php

namespace App\Domains\Instructor\Controllers;

use App\Domains\Admin\Resources\AdminBroadcastResource;
use App\Domains\Instructor\Services\InstructorAnnouncementService;
use Illuminate\Http\Request;

final class InstructorAnnouncementController
{
    public function store(Request $request, InstructorAnnouncementService $announcements): AdminBroadcastResource
    {
        $data = $request->validate([
            'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'replies_enabled' => ['nullable', 'boolean'],
            'quick_replies' => ['nullable', 'array', 'max:4'],
            'quick_replies.*' => ['string', 'max:100'],
        ]);
        return new AdminBroadcastResource($announcements->send($request->user(), $data));
    }
}
