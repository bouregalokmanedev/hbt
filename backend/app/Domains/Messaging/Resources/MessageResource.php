<?php

namespace App\Domains\Messaging\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

final class MessageResource extends JsonResource
{
    public function toArray($request): array
    {
        $deleted = $this->deletedState($request->user());

        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'sender' => $this->whenLoaded('sender', fn () => ['id' => $this->sender->uuid, 'name' => $this->sender->full_name]),
            'message_type' => $this->message_type,
            'body' => $deleted !== null ? null : $this->body,
            'edited' => $this->edited_at !== null,
            'edited_at' => $this->edited_at?->toISOString(),
            // `metadata` is internal bookkeeping (tombstones, `deleted_for`,
            // storage paths). Everything a client may read is projected below,
            // so the raw blob never leaves the API.
            'attachment' => $deleted !== null ? null : $this->attachmentList($request)[0] ?? null,
            'attachments' => $deleted !== null ? null : $this->attachmentList($request),
            'forwarded_from' => $deleted !== null ? null : $this->forwardedFrom(),
            'deleted' => $deleted,
            'reactions' => $this->reactionMap(),
            'reacted' => $this->reactedBy($request->user()),
            'reply_to' => $this->reply_to_id,
            'reply_preview' => $this->resource->relationLoaded('replyTo') ? $this->replyPreview() : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    private function forwardedFrom(): ?array
    {
        $origin = $this->resource->forwardedFrom();
        if ($origin === null) {
            return null;
        }

        return [
            'message_id' => (string) ($origin['message_id'] ?? ''),
            'conversation_id' => (string) ($origin['conversation_id'] ?? ''),
            'sender_name' => isset($origin['sender_name']) ? (string) $origin['sender_name'] : null,
            'body_excerpt' => (string) ($origin['body_excerpt'] ?? ''),
        ];
    }

    private function deletedState($user): ?string
    {
        $metadata = is_array($this->metadata) ? $this->metadata : [];
        if (! empty($metadata['deleted_for_all'])) {
            return 'all';
        }
        if ($user !== null && in_array((int) $user->id, $this->resource->deletedForIds(), true)) {
            return 'mine';
        }

        return null;
    }

    private function replyPreview(): ?array
    {
        $parent = $this->replyTo;
        if ($parent === null) {
            return null;
        }
        $metadata = is_array($parent->metadata) ? $parent->metadata : [];
        $parentDeleted = ! empty($metadata['deleted_for_all']);

        return [
            'sender_name' => $parent->sender?->full_name,
            'body_excerpt' => mb_substr((string) ($parentDeleted ? '' : ($parent->body ?? '')), 0, 120),
            'has_attachment' => ! $parentDeleted && $parent->attachments() !== [],
        ];
    }

    private function reactionMap(): array
    {
        $reactions = is_array($this->metadata) ? ($this->metadata['reactions'] ?? null) : null;
        return is_array($reactions) ? $reactions : [];
    }

    private function reactedBy($user): array
    {
        if ($user === null) return [];
        $viewerId = (int) $user->id;
        $mine = [];
        foreach ($this->reactionMap() as $emoji => $ids) {
            if (in_array($viewerId, array_map('intval', (array) $ids), true)) $mine[] = $emoji;
        }
        return array_values($mine);
    }

    /**
     * @return list<array>
     */
    private function attachmentList($request): array
    {
        $attachments = $this->resource->attachments();

        return array_values(array_map(
            fn (array $attachment, int $index) => $this->attachmentPayload($request, $attachment, $index),
            $attachments,
            array_keys($attachments)
        ));
    }

    private function attachmentPayload($request, array $attachment, int $index = 0): array
    {
        // Bare <img>/<a> requests carry no Bearer token, so the signed URL
        // embeds the viewer's uuid (and which attachment) and the controller
        // re-checks participation. The query string is covered by the
        // signature, so neither can be edited.
        $params = ['message' => $this->id, 'a' => $index];
        if ($request?->user() !== null) {
            $params['viewer'] = $request->user()->uuid;
        }

        return [
            'name' => $attachment['name'] ?? 'file',
            'mime' => $attachment['mime'] ?? 'application/octet-stream',
            'size' => (int) ($attachment['size'] ?? 0),
            'url' => URL::temporarySignedRoute('messages.attachments.download', now()->addDay(), $params),
        ];
    }
}
