<?php

namespace App\Domains\Admin\Services;

use App\Domains\Notifications\Models\AdminBroadcast;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Messaging\Services\MessagingService;
use App\Enums\UserRole;
use App\Events\ModelChanged;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final readonly class AdminBroadcastService
{
    public function __construct(
        private StudentNotificationService $notifications,
        private MessagingService $messaging,
    ) {
    }

    /**
     * @param array{audience:string,type:string,title:string,message:string,action_url:?string,recipient_ids?:array<int,string>} $data
     */
    public function send(User $administrator, array $data): AdminBroadcast
    {
        $broadcast = AdminBroadcast::query()->create([
            'admin_id' => $administrator->id,
            'audience' => $data['audience'],
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'action_url' => $data['action_url'] ?? null,
            'replies_enabled' => $data['replies_enabled'] ?? true,
            'quick_replies' => $data['quick_replies'] ?? ['Got it', 'I have a question'],
        ]);

        $recipients = $this->recipients($data);
        $recipientCount = (clone $recipients)->count();
        $delivered = 0;
        $failed = 0;

        $recipients->with('studentNotificationSetting')->chunkById(250, function ($users) use ($broadcast, &$delivered, &$failed): void {
            foreach ($users as $user) {
                try {
                    $conversation = $this->messaging->createAnnouncement(
                        $broadcast->administrator,
                        $user,
                        $broadcast->id,
                        $broadcast->title,
                        $broadcast->message,
                        $broadcast->replies_enabled,
                        $broadcast->quick_replies ?? [],
                    );

                    if ($this->notifications->send(
                        $user,
                        $broadcast->type,
                        $broadcast->title,
                        $broadcast->message,
                        $broadcast->action_url,
                        'broadcast:' . $broadcast->id,
                        $broadcast->id,
                        $conversation->id,
                    )) {
                        $delivered++;
                    }
                } catch (\Throwable) {
                    $failed++;
                }
            }
        });

        $broadcast->update([
            'recipient_count' => $recipientCount,
            'delivered_count' => $delivered,
            'failed_count' => $failed,
            'delivered_at' => now(),
        ]);

        event(new ModelChanged(
            event: 'admin.broadcast_sent',
            model: $broadcast,
            new: [
                'audience' => $broadcast->audience,
                'recipient_count' => $recipientCount,
                'delivered_count' => $delivered,
                'failed_count' => $failed,
            ],
        ));

        return $broadcast->fresh();
    }

    private function recipients(array $data): Builder
    {
        $users = User::query()->where('status', 'active');

        return match ($data['audience']) {
            'students' => $users->whereHas('roles', fn ($roles) => $roles->where('name', UserRole::STUDENT->value)),
            'instructors' => $users->whereHas('roles', fn ($roles) => $roles->where('name', UserRole::INSTRUCTOR->value)),
            'selected' => $users->whereIn('uuid', $data['recipient_ids'] ?? []),
            default => $users,
        };
    }
}
