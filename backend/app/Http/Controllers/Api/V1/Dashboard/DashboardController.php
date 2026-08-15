<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Actions\Dashboard\GetDashboardAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Dashboard\DashboardResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly GetDashboardAction $action,
    ) {}

    public function __invoke(
        Request $request
    ): JsonResponse {
        $dashboard = $this->action->execute(
            $request->user()
        );

        return $this->success(
            new DashboardResource(
                $dashboard
            ),
            'Dashboard retrieved successfully.'
        );
    }
}