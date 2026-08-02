<?php

namespace App\Core\Domain\DTOs;

abstract readonly class DataTransferObject
{
    public function toArray(): array
    {
        return get_object_vars($this);
    }
}