<?php

namespace App\Domains\Admin\Queries;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class AdminCrmQuery
{
    private const COUNT_METRICS = [
        ['key' => 'signups', 'table' => 'users', 'column' => 'created_at'],
        ['key' => 'enrollments', 'table' => 'enrollments', 'column' => 'enrolled_at'],
        ['key' => 'orders', 'table' => 'orders', 'column' => 'created_at'],
        ['key' => 'messages', 'table' => 'contact_messages', 'column' => 'created_at'],
    ];

    public function __construct(
        private readonly CarbonImmutable $from,
        private readonly CarbonImmutable $to,
        private readonly string $bucket,
        private readonly string $range,
    ) {
    }

    public static function between(CarbonImmutable $from, CarbonImmutable $to, string $bucket, string $range): self
    {
        return new self($from, $to, $bucket, $range);
    }

    public function payload(): array
    {
        $labels = $this->labels();

        $series = [];
        foreach (self::COUNT_METRICS as $metric) {
            $series[$metric['key']] = $this->zeroFill($this->aggregate($metric['table'], $metric['column'], 'COUNT(*)'), $labels);
        }
        $series['revenue'] = $this->zeroFill($this->aggregate('orders', 'paid_at', 'SUM(total)'), $labels);

        return [
            'range' => $this->range,
            'bucket' => $this->bucket,
            'period' => [
                'from' => $this->from->toDateString(),
                'to' => $this->to->toDateString(),
            ],
            'labels' => $labels,
            'totals' => [
                'signups' => (int) array_sum($series['signups']),
                'enrollments' => (int) array_sum($series['enrollments']),
                'orders' => (int) array_sum($series['orders']),
                'revenue' => (int) array_sum($series['revenue']),
                'messages' => (int) array_sum($series['messages']),
            ],
            'series' => [
                'signups' => array_map('intval', $series['signups']),
                'enrollments' => array_map('intval', $series['enrollments']),
                'orders' => array_map('intval', $series['orders']),
                'revenue' => array_map('intval', $series['revenue']),
                'messages' => array_map('intval', $series['messages']),
            ],
        ];
    }

    private function labels(): array
    {
        $labels = [];

        if ($this->bucket === 'day') {
            for ($day = $this->from->startOfDay(); $day->lte($this->to); $day = $day->addDay()) {
                $labels[] = $day->toDateString();
            }

            return $labels;
        }

        for ($month = $this->from->startOfMonth(); $month->lte($this->to); $month = $month->addMonth()) {
            $labels[] = $month->format('Y-m');
        }

        return $labels;
    }

    private function aggregate(string $table, string $column, string $metricSql): array
    {
        $expression = $this->bucketExpression($column);

        $rows = DB::table($table)
            ->whereBetween($column, [$this->from, $this->to])
            ->selectRaw("{$expression} as bucket, {$metricSql} as total")
            ->groupByRaw($expression)
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $out[(string) $row->bucket] = (float) $row->total;
        }

        return $out;
    }

    private function bucketExpression(string $column): string
    {
        if ($this->bucket === 'day') {
            return "DATE({$column})";
        }

        return match (DB::connection()->getDriverName()) {
            'mysql' => "DATE_FORMAT({$column}, '%Y-%m')",
            'pgsql' => "to_char({$column}, 'YYYY-MM')",
            default => "strftime('%Y-%m', {$column})",
        };
    }

    private function zeroFill(array $counts, array $labels): array
    {
        return array_map(
            fn (string $label) => $counts[$label] ?? 0.0,
            $labels,
        );
    }
}
