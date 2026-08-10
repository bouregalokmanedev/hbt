<?php

namespace App\Core\Query;

abstract class Query
{
    protected array $filters = [];

    public function filters(): array
    {
        return $this->filters;
    }

    protected function add(string $key, mixed $value): static
    {
        $this->filters[$key] = $value;

        return $this;
    }
}