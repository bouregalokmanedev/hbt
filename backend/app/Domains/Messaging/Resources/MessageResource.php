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
            'metadata' => $this->metadata,
            'attachment' => $deleted !== null ? null : $this->attachmentPayload(),
            'deleted' => $deleted,
            'reactions' => $this->reactionMap(),
            'reacted' => $this->reactedBy($request->user()),
            'reply_to' => $this->reply_to_id,
            'reply_preview' => $this->resource->relationLoaded('replyTo') ? $this->replyPreview() : null,
            'created_at' => $this->created_at?->toISOString(),
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
            'has_attachment' => ! $parentDeleted && ! empty($metadata['attachment']['path']),
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

    private function attachmentPayload(): ?array
    {
        $attachment = is_array($this->metadata) ? ($this->metadata['attachment'] ?? null) : null;
        if (! is_array($attachment) || empty($attachment['path'])) return null;
        return [
            'name' => $attachment['name'] ?? 'file',
            'mime' => $attachment['mime'] ?? 'application/octet-stream',
            'size' => (int) ($attachment['size'] ?? 0),
            'url' => URL::temporarySignedRoute('messages.attachments.download', now()->addDay(), ['message' => $this->id]),
        ];
    }
}
