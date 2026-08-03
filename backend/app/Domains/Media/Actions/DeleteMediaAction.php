<?php

namespace App\Domains\Media\Actions;

use App\Domains\Media\Repositories\MediaRepositoryInterface;
use App\Domains\Media\Services\MediaService;
use App\Models\Media;
use Illuminate\Support\Facades\DB;

final class DeleteMediaAction
{
    public function __construct(
        private readonly MediaRepositoryInterface $media,
        private readonly MediaService $service,
    ) {}

    public function execute(Media $media): void
    {
        DB::transaction(function () use ($media) {
            $this->service->delete(
                $media->disk,
                $media->path
            );

            $this->media->delete($media);
        });
    }
}