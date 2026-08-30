<?php

namespace App\Domains\Instructor\Services;

use App\Domains\Messaging\Services\MessagingService;
use App\Domains\Notifications\Models\AdminBroadcast;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final readonly class InstructorAnnouncementService
{
    public function __construct(
        private MessagingService $messaging,
        private StudentNotificationService $notifications,
    ) {}

    public function send(User $instructor, array $data): AdminBroadcast
    {
        if (!empty($data['course_id'])) {
            abort_unless(Course::query()->whereKey($data['course_id'])->where('instructor_id', $instructor->id)->exists(), 403, 'You can only announce to your own courses.');
        }

        $broadcast = AdminBroadcast::create([
            'admin_id' => $instructor->id,
            'audience' => 'students',
            'type' => 'announcement',
            'title' => $data['title'],
            'message' => $data['message'],
            'action_url' => $data['action_url'] ?? null,
            'replies_enabled' => $data['replies_enabled'] ?? true,
            'quick_replies' => $data['quick_replies'] ?? ['Got it', 'I have a question'],
        ]);

        $recipients = $this->recipients($instructor, $data['course_id'] ?? null);
        $broadcast->recipient_count = (clone $recipients)->count();
        $delivered = 0;
        $failed = 0;
        $recipients->with('studentNotificationSetting')->chunkById(250, function ($users) use ($broadcast, &$delivered, &$failed, $instructor): void {
            foreach ($users as $student) {
                try {
                    $conversation = $this->messaging->createAnnouncement($instructor, $student, $broadcast->id, $broadcast->title, $broadcast->message, $broadcast->replies_enabled, $broadcast->quick_replies ?? []);
                    if ($this->notifications->send($student, 'announcement', $broadcast->title, $broadcast->message, $broadcast->action_url, 'broadcast:' . $broadcast->id, $broadcast->id, $conversation->id)) $delivered++;
                } catch (\Throwable) { $failed++; }
            }
        });
        $broadcast->forceFill(['delivered_count' => $delivered, 'failed_count' => $failed, 'delivered_at' => now()])->save();
        return $broadcast->fresh();
    }

    private function recipients(User $instructor, ?string $courseId): Builder
    {
        return User::query()->where('status', 'active')->whereHas('roles', fn ($roles) => $roles->where('name', UserRole::STUDENT->value))->whereHas('enrollments.course', function ($courses) use ($instructor, $courseId): void {
            $courses->where('instructor_id', $instructor->id)->when($courseId, fn ($query) => $query->whereKey($courseId));
        });
    }
}
