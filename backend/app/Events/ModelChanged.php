<?php

namespace App\Events;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ModelChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public string $event,
        public Model $model,
        public array $old = [],
        public array $new = [],
        public array $metadata = [],
    ) {}
}