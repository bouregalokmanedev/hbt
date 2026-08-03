<?php

namespace App\Domains\Media\Events;

use App\Models\Media;

final class MediaUploaded
{
    public function __construct(
        public readonly Media $media
    ) {}
}
