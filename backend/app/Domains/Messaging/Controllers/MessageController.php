<?php

namespace App\Domains\Messaging\Controllers;

use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Resources\MessageResource;
use App\Domains\Messaging\Services\MessagingService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class MessageController
{
    public const ATTACHMENT_MAX_KB = 10240;

    public const ATTACHMENT_MIMES = 'pdf,doc,docx,png,jpg,jpeg';

    public function store(Request $request, MessageConversation $conversation, MessagingService $messaging)
    {
        Gate::authorize('send', $conversation);
        $data = $request->validate([
            'body' => ['nullable', 'string', 'max:5000', 'required_without:file'],
            'message_type' => ['nullable', 'in:text,quick_reply'],
            'file' => ['nullable', 'file', 'mimes:' . self::ATTACHMENT_MIMES, 'max:' . self::ATTACHMENT_MAX_KB],
            'reply_to' => ['nullable', 'uuid', 'exists:messages,id'],
        ]);
        $replyTo = null;
        if (! empty($data['reply_to'])) {
            $replyTo = Message::query()->whereKey($data['reply_to'])->firstOrFail();
            abort_if($replyTo->conversation_id !== $conversation->id, 422, 'The quoted message belongs to another conversation.');
        }
        $attachment = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->storeAs(
                'message-attachments/' . $conversation->id,
                (string) Str::uuid() . '.' . $file->getClientOriginalExtension(),
                'local'
            );
            $attachment = [
                'name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
            ];
        }
        return new MessageResource($messaging->send($request->user(), $conversation, (string) ($data['body'] ?? ''), $data['message_type'] ?? 'text', $attachment, $replyTo?->id));
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
        Gate::authorize('view', $message->conversation);
        $data = $request->validate(['scope' => ['required', 'in:for_me,for_all']]);
        $user = $request->user();
        $metadata = is_array($message->metadata) ? $message->metadata : [];

        if ($data['scope'] === 'for_all') {
            abort_unless((int) $message->sender_id === (int) $user->id, 403, 'Only the sender can delete a message for everyone.');
            abort_unless($message->created_at->isAfter(now()->subMinutes(15)), 403, 'Messages can only be deleted for everyone within 15 minutes of sending.');
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
        Gate::authorize('view', $message->conversation);
        $data = $request->validate([
            'emoji' => [\Illuminate\Validation\Rule::in(['❤️', '👍', '😂', '😮', '😢', '🙏'])],
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
        Gate::authorize('view', $message->conversation);
        abort_if($message->isDeletedForAll(), 404);
        $attachment = $message->metadata['attachment'] ?? null;
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
}
