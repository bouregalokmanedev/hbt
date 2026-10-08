<?php

namespace App\Domains\Media\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /*
         * All media uses a time-limited signed URL so files are never
         * world-readable off the public disk. Authorization already
         * happened when the parent lesson/course payload was loaded.
         */
        $url = URL::temporarySignedRoute(
            'media.stream',
            now()->addHours($this->type->value === 'video' ? 2 : 24),
            ['media' => $this->id],
        );

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