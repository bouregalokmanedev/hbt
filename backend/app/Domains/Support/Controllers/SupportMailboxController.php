<?php

namespace App\Domains\Support\Controllers;

use App\Domains\Support\Models\SupportMail;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportMailboxController extends Controller
{
    use AuthorizesRequests;

    private const FOLDERS = ['inbox', 'sent', 'archive'];

    public function index(Request $request): JsonResponse
    {
        $this->authorize('manage', SupportMail::class);

        $folder = (string) $request->query('folder', 'inbox');
        if (! in_array($folder, self::FOLDERS, true)) {
            $folder = 'inbox';
        }

        $query = SupportMail::query()->inFolder($folder)->withCount('replies');

        if ($search = trim((string) $request->query('search', ''))) {
            $needle = '%'.mb_strtolower($search).'%';
            $query->where(function (Builder $builder) use ($needle): void {
                $builder->whereRaw('LOWER(subject) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(from_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(from_email) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(to_email) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(body) LIKE ?', [$needle]);
            });
        }

        $mails = $query->latest('created_at')->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $mails->getCollection()->map(fn (SupportMail $mail) => $this->serialize($mail)),
            'meta' => [
                'current_page' => $mails->currentPage(),
                'last_page' => $mails->lastPage(),
                'per_page' => $mails->perPage(),
                'total' => $mails->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
            'summary' => [
                'inbox' => SupportMail::inFolder('inbox')->count(),
                'inbox_unread' => SupportMail::inFolder('inbox')->whereNull('read_at')->count(),
                'sent' => SupportMail::inFolder('sent')->count(),
                'archive' => SupportMail::inFolder('archive')->count(),
            ],
        ]);
    }

    public function show(Request $request, SupportMail $mail): JsonResponse
    {
        $this->authorize('view', $mail);

        $root = $this->rootOf($mail);

        if ($root->direction === SupportMail::DIRECTION_INBOUND && $root->read_at === null) {
            $root->update(['read_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Conversation retrieved.',
            'data' => $this->threadData($root),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('compose', SupportMail::class);

        $data = $request->validate([
            'to_email' => ['required', 'email:rfc', 'max:255'],
            'to_name' => ['nullable', 'string', 'max:150'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'min:10', 'max:5000'],
            'recipient_user_id' => ['nullable', 'uuid', 'exists:users,uuid'],
        ]);

        $user = $request->user();
        $recipient = ! empty($data['recipient_user_id'])
            ? User::query()->where('uuid', $data['recipient_user_id'])->first()
            : null;

        $mail = SupportMail::create([
            'direction' => SupportMail::DIRECTION_OUTBOUND,
            'subject' => $data['subject'],
            'body' => $data['body'],
            'from_name' => $user->full_name,
            'from_email' => $user->email,
            'to_name' => $data['to_name'] ?? null,
            'to_email' => $data['to_email'],
            'sender_user_id' => $user->id,
            'recipient_user_id' => $recipient?->id,
        ]);

        $this->notifyStudentRecipient($recipient, (string) $data['to_email'], $user, $mail);

        return response()->json([
            'success' => true,
            'message' => 'Message sent.',
            'data' => $this->threadData($mail),
        ], 201);
    }

    public function reply(Request $request, SupportMail $mail): JsonResponse
    {
        $this->authorize('manage', SupportMail::class);

        $data = $request->validate([
            'body' => ['required', 'string', 'min:10', 'max:5000'],
        ]);

        $root = $this->rootOf($mail);
        $user = $request->user();
        $incoming = $root->direction === SupportMail::DIRECTION_INBOUND;
        $toEmail = $incoming ? $root->from_email : $root->to_email;

        $reply = SupportMail::create([
            'thread_id' => $root->id,
            'direction' => SupportMail::DIRECTION_OUTBOUND,
            'subject' => $root->subject,
            'body' => $data['body'],
            'from_name' => $user->full_name,
            'from_email' => $user->email,
            'to_name' => $incoming ? $root->from_name : $root->to_name,
            'to_email' => $toEmail,
            'sender_user_id' => $user->id,
            'recipient_user_id' => $incoming ? $root->recipient_user_id : null,
        ]);

        $this->notifyStudentRecipient(
            $incoming ? User::query()->find($root->recipient_user_id) : null,
            (string) $toEmail,
            $user,
            $reply,
        );

        $root->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Reply added to the conversation.',
            'data' => $this->threadData($root),
        ]);
    }

    /**
     * The mailbox is support's line to a learner, but the student only ever
     * sees it through their Support sidebar badge — nothing else in the app
     * surfaces an outbound support mail. Staff-to-staff threads and the
     * sender's own messages stay quiet.
     */
    private function notifyStudentRecipient(?User $recipient, string $email, User $sender, SupportMail $mail): void
    {
        $user = $recipient ?? User::query()->where('email', $email)->first();

        if ($user === null || $user->id === $sender->id || ! $user->hasRole(UserRole::STUDENT->value)) {
            return;
        }

        try {
            app(\App\Domains\Notifications\Services\StudentNotificationService::class)->send(
                $user,
                'support',
                'Support replied to you',
                \Illuminate\Support\Str::limit(trim((string) $mail->body), 160),
                '/support',
                'support-mail:'.$mail->id,
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Support mailbox notification failed: '.$e->getMessage(), ['mail_id' => $mail->id]);
        }
    }

    public function read(Request $request, SupportMail $mail): JsonResponse
    {
        $this->authorize('manage', SupportMail::class);

        $data = $request->validate([
            'read' => ['required', 'boolean'],
        ]);

        $root = $this->rootOf($mail);
        $root->update(['read_at' => $data['read'] ? now() : null]);

        return response()->json([
            'success' => true,
            'message' => $data['read'] ? 'Marked as read.' : 'Marked as unread.',
            'data' => $this->serialize($root),
        ]);
    }

    public function archive(Request $request, SupportMail $mail): JsonResponse
    {
        $this->authorize('manage', SupportMail::class);

        $data = $request->validate([
            'archived' => ['required', 'boolean'],
        ]);

        $root = $this->rootOf($mail);
        $root->update(['archived_at' => $data['archived'] ? now() : null]);

        return response()->json([
            'success' => true,
            'message' => $data['archived'] ? 'Conversation archived.' : 'Conversation moved back to the inbox.',
            'data' => $this->serialize($root),
        ]);
    }

    /**
     * Recipient picker for the composer — students only, the mailbox is how
     * support reaches learners (they answer through tickets).
     */
    public function recipients(Request $request): JsonResponse
    {
        $this->authorize('compose', SupportMail::class);

        $search = trim((string) $request->query('search', ''));

        $recipients = User::query()
            ->whereHas('roles', fn ($roles) => $roles->where('name', UserRole::STUDENT->value))
            ->when($search !== '', fn (Builder $builder) => $builder->where(function (Builder $query) use ($search): void {
                $needle = '%'.mb_strtolower($search).'%';
                $query->whereRaw('LOWER(first_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(last_name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$needle]);
            }))
            ->orderBy('first_name')
            ->limit(10)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->uuid,
                'name' => $user->full_name,
                'email' => $user->email,
            ])
            ->values();

        return response()->json(['data' => $recipients]);
    }

    private function rootOf(SupportMail $mail): SupportMail
    {
        return $mail->isRoot() ? $mail : ($mail->root ?? $mail);
    }

    private function threadData(SupportMail $root): array
    {
        $messages = SupportMail::query()
            ->where(function (Builder $builder) use ($root): void {
                $builder->where('id', $root->id)->orWhere('thread_id', $root->id);
            })
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(fn (SupportMail $message) => $this->serializeMessage($message))
            ->values();

        return array_merge($this->serialize($root), ['messages' => $messages]);
    }

    private function serialize(SupportMail $mail): array
    {
        return [
            'id' => $mail->id,
            'direction' => $mail->direction,
            'subject' => $mail->subject,
            'from_name' => $mail->from_name,
            'from_email' => $mail->from_email,
            'to_name' => $mail->to_name,
            'to_email' => $mail->to_email,
            'read' => $mail->read_at !== null,
            'archived' => $mail->archived_at !== null,
            'message_count' => (int) ($mail->replies_count ?? $mail->replies()->count()),
            'preview' => Str::limit(Str::of($mail->body)->squish(), 140),
            'created_at' => $mail->created_at?->toISOString(),
        ];
    }

    private function serializeMessage(SupportMail $mail): array
    {
        return [
            'id' => $mail->id,
            'direction' => $mail->direction,
            'body' => $mail->body,
            'from_name' => $mail->from_name,
            'from_email' => $mail->from_email,
            'to_name' => $mail->to_name,
            'to_email' => $mail->to_email,
            'created_at' => $mail->created_at?->toISOString(),
        ];
    }
}
