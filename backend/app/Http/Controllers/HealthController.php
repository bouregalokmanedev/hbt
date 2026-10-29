<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Throwable;

class HealthController extends Controller
{
    /**
     * Readiness probe for load balancers and uptime monitors.
     *
     * It checks the dependencies the application cannot serve traffic
     * without and never exposes credentials or exception details.
     */
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->check(fn () => DB::select('select 1')),
            'cache' => $this->check(function (): void {
                $key = 'health:probe';
                Cache::put($key, 'ok', 10);

                if (Cache::get($key) !== 'ok') {
                    throw new \RuntimeException('Cache read/write failed.');
                }

                Cache::forget($key);
            }),
            'queue' => $this->check(function (): void {
                if (config('queue.default') === 'sync') {
                    return;
                }

                Queue::connection()->size();
            }),
            'storage' => $this->check(function (): void {
                foreach ([storage_path('framework'), storage_path('logs')] as $path) {
                    if (! is_dir($path) || ! is_writable($path)) {
                        throw new \RuntimeException("Storage path is not writable: {$path}");
                    }
                }
            }),
        ];

        $healthy = ! in_array('failed', $checks, true);

        if (! $healthy) {
            Log::error('Health probe failed.', ['checks' => $checks]);
        }

        return response()->json([
            'success' => $healthy,
            'status' => $healthy ? 'ok' : 'degraded',
            'service' => 'hbt-learning-platform',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    private function check(callable $check): string
    {
        try {
            $check();

            return 'ok';
        } catch (Throwable) {
            return 'failed';
        }
    }
}
