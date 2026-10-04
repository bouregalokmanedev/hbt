<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * A day-by-day series of what happened in this instructor's courses.
 *
 * Rows are fetched as a single date column and bucketed in PHP rather than
 * with `GROUP BY DATE(...)` — that expression is MySQL/SQLite-only and would
 * break on Postgres, which this app also targets.
 */
final class TrendController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $instructorId = (int) $request->user()->id;

        $days = min(365, max(7, (int) $request->input('days', 30)));
        $from = Carbon::today()->subDays($days - 1);

        $courseIds = Course::query()
            ->where('instructor_id', $instructorId)
            ->pluck('id');

        $buckets = [];
        for ($offset = 0; $offset < $days; $offset++) {
            $date = $from->copy()->addDays($offset)->toDateString();
            $buckets[$date] = ['date' => $date, 'enrollments' => 0, 'completions' => 0];
        }

        $bucketize = function ($timestamps, string $key) use (&$buckets): void {
            foreach ($timestamps as $timestamp) {
                $date = Carbon::parse($timestamp)->toDateString();
                if (isset($buckets[$date])) {
                    $buckets[$date][$key]++;
                }
            }
        };

        $bucketize(
            Enrollment::query()
                ->whereIn('course_id', $courseIds)
                ->whereNotNull('enrolled_at')
                ->where('enrolled_at', '>=', $from)
                ->pluck('enrolled_at'),
            'enrollments',
        );

        $bucketize(
            CourseProgress::query()
                ->whereIn('course_id', $courseIds)
                ->whereNotNull('completed_at')
                ->where('completed_at', '>=', $from)
                ->pluck('completed_at'),
            'completions',
        );

        $series = array_values($buckets);

        return response()->json([
            'data' => [
                'range' => [
                    'from' => $from->toDateString(),
                    'to' => $from->copy()->addDays($days - 1)->toDateString(),
                    'days' => $days,
                ],
                'series' => $series,
                'totals' => [
                    'enrollments' => array_sum(array_column($series, 'enrollments')),
                    'completions' => array_sum(array_column($series, 'completions')),
                ],
            ],
        ]);
    }
}
