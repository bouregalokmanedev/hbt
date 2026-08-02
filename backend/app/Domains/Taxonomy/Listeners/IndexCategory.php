<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Core\Search\SearchIndexerInterface;
use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Domains\Taxonomy\Events\CategoryUpdated;

final class IndexCategory
{
    public function __construct(
        private readonly SearchIndexerInterface $indexer
    ) {}

    public function handle(
        CategoryCreated|CategoryUpdated $event
    ): void {

        $this->indexer->index(
            $event->category
        );
    }
}