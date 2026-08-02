<?php

namespace App\Core\Domain\Services;

use Illuminate\Support\Facades\DB;

abstract class BaseService
{
    protected function transaction(
        callable $callback
    ) {
        return DB::transaction($callback);
    }
}