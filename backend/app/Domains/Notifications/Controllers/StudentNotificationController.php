<?php

namespace App\Domains\Notifications\Controllers;

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Notifications\Models\StudentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentNotificationController
{
    private const CATEGORIES = [
        'dashboard',
        'my-courses',
        'catalog',
        'assessments',
        'diagnostics',
        'achievements',
        'certificates',
        'simulator',
        'ai-mentor',
        'messages',
        'support',
        'announcements',
        'favourite',
        'subscription',
    ];

    public function index(Request $request): JsonResponse
    {
        // In-app feed is gated by the student's in_app_enabled master switch.
        // Rows still exist as the delivery ledger for email dedupe.
        if ($this->inAppDisabled($request)) {
            return response()->json(['data' => ['items' => [], 'unread_count' => 0]]);
        }

        $notifications = StudentNotification::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (StudentNotification $notification) => $this->serialize($notification));

        return response()->json(['data' => ['items' => $notifications, 'unread_count' => $notifications->whereNull('read_at')->count()]]);
    }

    public function read(Request $request, StudentNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 404);
        $notification->update(['read_at' => now()]);
        return response()->json(['data' => $this->serialize($notification->fresh())]);
    }

    public function readAll(Request $request): JsonResponse
    {
        StudentNotification::query()->where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['data' => ['success' => true]]);
    }

    public function sidebarBadges(Request $request): JsonResponse
    {
        $badges = array_fill_keys(self::CATEGORIES, 0);

        if (! $this->inAppDisabled($request)) {
            StudentNotification::query()
                ->where('user_id', $request->user()->id)
                ->whereNull('read_at')
                ->cursor()
                ->each(function (StudentNotification $notification) use (&$badges): void {
                    $category = $this->categoryFor($notification);
                    if ($category === 'messages' || $category === 'announcements') {
                        // Conversation read state is the source of truth here.
                        return;
                    }
                    $badges[$category]++;
                });
        }

        // Conversation truth: unread messages per type
        // (direct/group -> messages, announcement -> announcements).
        //
        // Counted in SQL and grouped by type: the previous implementation
        // streamed every unread message through a cursor on each poll, which
        // scales with the user's whole history rather than with their inbox.
        // The predicates live next to `unreadCountFor()` so the badge and the
        // inbox pill can never disagree.
        foreach (MessageConversation::unreadTotalsFor($request->user()) as $type => $total) {
            $badges[$type === 'announcement' ? 'announcements' : 'messages'] += $total;
        }

        return response()->json(['data' => $badges]);
    }

    public function markCategoryRead(Request $request, string $category): JsonResponse
    {
        abort_unless(in_array($category, self::CATEGORIES, true), 422);

        $ids = StudentNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->cursor()
            ->filter(fn (StudentNotification $notification) => $this->categoryFor($notification) === $category)
            ->map(fn (StudentNotification $notification) => $notification->id)
            ->all();

        $marked = $ids === [] ? 0 : StudentNotification::query()->whereIn('id', $ids)->update(['read_at' => now()]);

        return response()->json(['data' => ['success' => true, 'marked' => $marked]]);
    }

    private function inAppDisabled(Request $request): bool
    {
        return $request->user()->studentNotificationSetting?->in_app_enabled === false;
    }

    private function categoryFor(StudentNotification $notification): string
    {
        if ($notification->message_conversation_id !== null) {
            return 'messages';
        }

        if ($notification->admin_broadcast_id !== null || $notification->type === 'announcement') {
            return 'announcements';
        }

        $path = (string) parse_url((string) $notification->action_url, PHP_URL_PATH);

        foreach (self::CATEGORIES as $candidate) {
            if ($path === "/{$candidate}" || str_starts_with($path, "/{$candidate}/")) {
                return $candidate;
            }
        }

        return 'dashboard';
    }

    private function serialize(StudentNotification $notification): array
    {
        return ['id' => (string) $notification->id, 'type' => $notification->type, 'title' => $notification->title, 'message' => $notification->message, 'action_url' => $notification->action_url, 'conversation_id' => $notification->message_conversation_id, 'broadcast_id' => $notification->admin_broadcast_id, 'read_at' => $notification->read_at?->toISOString(), 'created_at' => $notification->created_at?->toISOString()];
    }
}
