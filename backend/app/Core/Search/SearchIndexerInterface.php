<?php

namespace App\Core\Search;

interface SearchIndexerInterface
{
    public function index(object $model): void;

    public function remove(object $model): void;
}