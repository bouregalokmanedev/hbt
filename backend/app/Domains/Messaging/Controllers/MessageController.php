<?php

namespace App\Domains\Messaging\Controllers;

use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Policies\MessagePolicy;
use App\Domains\Messaging\Resources\MessageResource;
use App\Domains\Messaging\Services\MessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class MessageController
{
    public function store(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('send', $conversation);
        $rule = [
            'mimes:' . implode(',', MessagingService::ATTACHMENT_MIMES),
            'max:' . MessagingService::ATTACHMENT_MAX_KB,
        ];
        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:5000', 'required_without_all:file,files'],
            'message_type' => ['nullable', 'in:text,quick_reply'],
            'file' => ['nullable', 'file', ...$rule],
            'files' => ['nullable', 'array', 'max:' . MessagingService::ATTACHMENTS_LIMIT],
            'files.*' => ['file', ...$rule],
            'reply_to' => ['nullable', 'uuid', 'exists:messages,id'],
        ]);
        $replyTo = null;
        if (! empty($data['reply_to'])) {
            $replyTo = Message::query()->whereKey($data['reply_to'])->firstOrFail();
            abort_if($replyTo->conversation_id !== $conversation->id, 422, 'The quoted message belongs to another conversation.');
        }
        $files = array_values(array_filter([
            ...($request->hasFile('file') ? [$request->file('file')] : []),
            ...($request->file('files') ?? []),
        ]));
        $attachments = [];
        foreach (array_slice($files, 0, MessagingService::ATTACHMENTS_LIMIT) as $file) {
            $path = $file->storeAs(
                'message-attachments/' . $conversation->id,
                (string) Str::uuid() . '.' . $file->getClientOriginalExtension(),
                'local'
            );
            $attachments[] = [
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
            ];
        }
        return new MessageResource($messaging->send($request->user(), $conversation, (string) ($data['body'] ?? ''), $data['message_type'] ?? 'text', $attachments, $replyTo?->id));
    }

    public function update(Request $request, Message $message)
    {
        Gate::authorize('view', $message->conversation);
        $this->refuse(app(MessagePolicy::class)->editDenial($request->user(), $message));

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message->forceFill(['body' => trim($data['body']), 'edited_at' => now()])->save();

        return new MessageResource($message->fresh(['sender:id,uuid,first_name,last_name', 'replyTo.sender:id,uuid,first_name,last_name']));
    }

    public function forward(Request $request, Message $message, MessagingService $messaging)
    {
        Gate::authorize('forward', $message);

        $data = $request->validate([
            'conversation_id' => ['required', 'uuid', 'exists:message_conversations,id'],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $target = MessageConversation::query()->findOrFail($data['conversation_id']);
        Gate::authorize('send', $target);

        return new MessageResource($messaging->forward($request->user(), $message, $target, (string) ($data['comment'] ?? '')));
    }

    public function typing(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('view', $conversation);
        $messaging->touchTyping($request->user(), $conversation);

        return response()->noContent();
    }

    public function index(Request $request, MessageConversation $conversation)
    {
        Gate::authorize('view', $conversation);
        $data = $request->validate([
            'before' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'search' => ['nullable', 'string', 'max:120'],
        ]);
        $perPage = (int) ($data['per_page'] ?? 30);

        $query = $conversation->messages()->reorder()
            ->with(['sender:id,uuid,first_name,last_name', 'replyTo.sender:id,uuid,first_name,last_name']);
        if (! empty($data['search'])) {
            $query->whereRaw('LOWER(messages.body) LIKE ?', ['%' . mb_strtolower($data['search']) . '%']);
        }
        if (! empty($data['before'])) {
            $query->where('messages.created_at', '<', Carbon::parse($data['before'])->toDateTimeString());
        }

        // Fetch one extra row to know whether older messages remain.
        $window = $query->orderByDesc('messages.created_at')->orderByDesc('messages.id')->limit($perPage + 1)->get();
        $messages = $window->take($perPage)->reverse()->values();

        return response()->json([
            'data' => MessageResource::collection($messages),
            'meta' => ['has_more' => $window->count() > $perPage],
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        Gate::authorize('delete', $message);
        $data = $request->validate(['scope' => ['required', 'in:for_me,for_all']]);
        $user = $request->user();
        $metadata = is_array($message->metadata) ? $message->metadata : [];

        if ($data['scope'] === 'for_all') {
            $this->refuse(app(MessagePolicy::class)->deleteForEveryoneDenial($user, $message));
            $metadata['deleted_for_all'] = true;
            $message->forceFill(['body' => null, 'metadata' => $metadata])->save();
        } else {
            $ids = $message->deletedForIds();
            if (! in_array((int) $user->id, $ids, true)) {
                $ids[] = (int) $user->id;
            }
            $metadata['deleted_for'] = $ids;
            $message->forceFill(['metadata' => $metadata])->save();
        }

        return new MessageResource($message->fresh(['sender:id,uuid,first_name,last_name', 'replyTo.sender:id,uuid,first_name,last_name']));
    }

    public function react(Request $request, Message $message)
    {
        Gate::authorize('react', $message);
        $data = $request->validate([
            'emoji' => [Rule::in(MessagingService::REACTIONS)],
        ]);

        $metadata = is_array($message->metadata) ? $message->metadata : [];
        $reactions = is_array($metadata['reactions'] ?? null) ? $metadata['reactions'] : [];
        $ids = array_values(array_unique(array_map('intval', (array) ($reactions[$data['emoji']] ?? []))));
        if (in_array((int) $request->user()->id, $ids, true)) {
            $ids = array_values(array_diff($ids, [(int) $request->user()->id]));
        } else {
            $ids[] = (int) $request->user()->id;
        }
        if ($ids === []) {
            unset($reactions[$data['emoji']]);
        } else {
            $reactions[$data['emoji']] = $ids;
        }
        $metadata['reactions'] = $reactions;
        $message->forceFill(['metadata' => $metadata])->save();

        return new MessageResource($message->fresh(['sender:id,uuid,first_name,last_name', 'replyTo.sender:id,uuid,first_name,last_name']));
    }

    public function download(Request $request, Message $message)
    {
        // Attachments are fetched by bare <img>/<a> requests that carry no
        // Bearer token, so participation is proven by the signed URL's `viewer`
        // claim (covered by the signature) rather than by a session. Signed
        // URLs issued without a viewer still fall back to an API caller.
        $viewer = $this->resolveViewer($request);
        abort_unless($viewer !== null, 401, 'This download link is not tied to an account.');
        Gate::forUser($viewer)->authorize('view', $message);
        abort_if($message->isDeletedForAll(), 404);
        $attachments = $message->attachments();
        $attachment = $attachments[(int) $request->query('a', 0)] ?? null;
        abort_unless(is_array($attachment) && ! empty($attachment['path']), 404);
        $disk = Storage::disk('local');
        abort_unless($disk->exists($attachment['path']), 404);
        $name = $attachment['name'] ?? 'file';
        $mime = $attachment['mime'] ?? 'application/octet-stream';
        if (str_starts_with($mime, 'image/')) {
            return response()->file($disk->path($attachment['path']), ['Content-Type' => $mime]);
        }
        return $disk->download($attachment['path'], $name, ['Content-Type' => $mime]);
    }

    public function read(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('view', $conversation);
        $messaging->markRead($request->user(), $conversation);
        return response()->json(['data' => ['success' => true]]);
    }

    /**
     * Abort with whatever the policy decided, so the status and reason live in
     * one place instead of being restated at each call site.
     *
     * @param  array{0: int, 1: string}|null  $denial
     */
    private function refuse(?array $denial): void
    {
        if ($denial !== null) {
            abort($denial[0], $denial[1]);
        }
    }

    /**
     * The viewer a signed attachment URL was issued to.
     *
     * A present-but-unresolvable `viewer` is a hard failure: the signature
     * already proved the query string was not tampered with, so the account
     * simply no longer exists and the link must not degrade to "whoever asks".
     */
    private function resolveViewer(Request $request)
    {
        $uuid = $request->query('viewer');

        if (! is_string($uuid) || $uuid === '') {
            return $request->user();
        }

        return \App\Models\User::query()->where('uuid', $uuid)->first();
    }
}
