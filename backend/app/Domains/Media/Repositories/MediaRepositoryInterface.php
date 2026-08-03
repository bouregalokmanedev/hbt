<?php

namespace App\Domains\Media\Repositories;

use App\Models\Media;

interface MediaRepositoryInterface
{
    public function create(array $data): Media;

    public function delete(Media $media): void;
}
