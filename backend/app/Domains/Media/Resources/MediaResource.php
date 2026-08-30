<?php

namespace App\Domains\Media\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $url = $this->type->value === 'video'
            ? route('media.stream', [
                'media' => $this->id,
            ])
            : Storage::disk($this->disk)->url($this->path);

        return [
            'id' => $this->id,

            'original_name' => $this->original_name,
            'filename' => $this->filename,

            'mime_type' => $this->mime_type,
            'extension' => $this->extension,

            'size' => $this->size,

            'type' => $this->type->value,

            'disk' => $this->disk,
            'path' => $this->path,

            'url' => $url,

            'mediable_type' => $this->mediable_type,
            'mediable_id' => $this->mediable_id,

            'metadata' => $this->metadata,

            'created_at' => $this->created_at,
        ];
    }
}