<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Core\Search\SearchIndexerInterface;
use App\Domains\Taxonomy\Events\CategoryDeleted;

final class RemoveCategoryFromSearch
{
    public function __construct(
        private readonly SearchIndexerInterface $indexer
    ) {}

    public function handle(
        CategoryDeleted $event
    ): void {

        $this->indexer->remove(
            $event->category
        );
    }
}