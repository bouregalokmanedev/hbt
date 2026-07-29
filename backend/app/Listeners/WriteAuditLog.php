<?php

namespace App\Listeners;

use App\Events\ModelChanged;
use App\Services\Audit\AuditService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class WriteAuditLog implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 5;
    public int $backoff = 10;
    public string $queue = 'audit';

    public function __construct(
        private AuditService $audit
    ) {}

    public function handle(ModelChanged $event): void
    {
        logger()->info('Audit Event Fired', [
        'event' => $event->event,
    ]);

        $this->audit->log(
            $event->event,
            $event->model,
            $event->old,
            $event->new,
            $event->metadata
        );
    }
    public function failed(ModelChanged $event,\Throwable $exception): void {

    logger()->error('Audit log failed', [

        'event' => $event->event,

        'model' => get_class($event->model),

        'id' => $event->model->getKey(),

        'exception' => $exception->getMessage(),

    ]);

}
}