<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminCrmQuery;
use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminCrmController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $data = $request->validate([
            'range' => ['nullable', 'string', 'in:week,month,6months,year,2years'],
        ]);

        $range = $data['range'] ?? 'month';
        $now = CarbonImmutable::now();

        [$from, $to, $bucket] = match ($range) {
            'week' => [$now->subDays(6)->startOfDay(), $now->endOfDay(), 'day'],
            '6months' => [$now->subMonths(5)->startOfMonth(), $now->endOfDay(), 'month'],
            'year' => [$now->subMonths(11)->startOfMonth(), $now->endOfDay(), 'month'],
            '2years' => [$now->subMonths(23)->startOfMonth(), $now->endOfDay(), 'month'],
            default => [$now->subDays(29)->startOfDay(), $now->endOfDay(), 'day'],
        };

        return response()->json([
            'success' => true,
            'message' => 'CRM statistics retrieved.',
            'data' => AdminCrmQuery::between($from, $to, $bucket, $range)->payload(),
        ]);
    }
}
