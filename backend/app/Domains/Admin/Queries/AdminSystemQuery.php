<?php

namespace App\Domains\Admin\Queries;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class AdminSystemQuery
{
    public function health(): array
    {
        $checks = [
            'database' => $this->databaseHealth(),
            'cache' => $this->configuredHealth('cache', config('cache.default')),
            'queue' => $this->configuredHealth('queue', config('queue.default')),
            'storage' => $this->configuredHealth('storage', config('filesystems.default')),
            'mail' => $this->configuredHealth('mail', config('mail.default')),
        ];

        $healthy = collect($checks)->every(fn (array $check) => $check['status'] !== 'unavailable');

        return [
            'status' => $healthy ? 'healthy' : 'degraded',
            'application' => [
                'name' => config('app.name'),
                'environment' => app()->environment(),
                'laravel_version' => app()->version(),
                'php_version' => PHP_VERSION,
                'timezone' => config('app.timezone'),
            ],
            'checks' => $checks,
            'checked_at' => now()->toISOString(),
        ];
    }

    public function statistics(): array
    {
        $tables = [
            'users',
            'courses',
            'sections',
            'lessons',
            'quizzes',
            'quiz_questions',
            'enrollments',
            'course_progress',
            'certificates',
            'assessments',
            'assessment_attempts',
            'mentor_conversations',
            'mentor_messages',
            'media',
            'audit_logs',
        ];

        return [
            'records' => collect($tables)
                ->mapWithKeys(fn (string $table) => [
                    $table => Schema::hasTable($table)
                        ? DB::table($table)->count()
                        : null,
                ])
                ->all(),
            'generated_at' => now()->toISOString(),
        ];
    }

    public function auditLogSummary(): array
    {
        return [
            'summary' => [
                'total' => AuditLog::query()->count(),
                'today' => AuditLog::query()->whereDate('created_at', today())->count(),
                'last_7_days' => AuditLog::query()->where('created_at', '>=', now()->subDays(7))->count(),
            ],
            'events' => AuditLog::query()
                ->selectRaw('event, COUNT(*) as total')
                ->groupBy('event')
                ->orderByDesc('total')
                ->limit(10)
                ->get()
                ->map(fn ($row) => [
                    'event' => $row->event,
                    'total' => (int) $row->total,
                ])
                ->values()
                ->all(),
            'generated_at' => now()->toISOString(),
        ];
    }

    private function databaseHealth(): array
    {
        try {
            DB::select('SELECT 1');

            return [
                'status' => 'operational',
                'connection' => config('database.default'),
            ];
        } catch (\Throwable) {
            return [
                'status' => 'unavailable',
            ];
        }
    }

    private function configuredHealth(string $service, ?string $driver): array
    {
        try {
            if ($service === 'cache' && $driver) {
                Cache::store($driver)->get('__hbt_admin_health_probe__');
            }

            return [
                'status' => $driver ? 'configured' : 'unavailable',
                'driver' => $driver,
            ];
        } catch (\Throwable) {
            return [
                'status' => 'unavailable',
            ];
        }
    }
}
