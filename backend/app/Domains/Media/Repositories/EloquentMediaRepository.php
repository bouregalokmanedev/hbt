<?php

namespace App\Domains\Media\Repositories;

use App\Models\Media;

final class EloquentMediaRepository implements MediaRepositoryInterface
{
    public function create(array $data): Media
    {
        return Media::query()->create($data);
    }

    public function delete(Media $media): void
    {
        $media->delete();
    }
}
