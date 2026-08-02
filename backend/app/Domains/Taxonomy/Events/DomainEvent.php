<?php

namespace App\Domains\Taxonomy\Events;

use App\Core\Domain\Events\DomainEvent;
use App\Models\Category;

class CategoryCreated extends DomainEvent
{
    public function __construct(

        public readonly Category $category

    ){}
}