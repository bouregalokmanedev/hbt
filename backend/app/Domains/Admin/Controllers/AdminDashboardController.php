<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminDashboardQuery;
use App\Domains\Admin\Resources\AdminDashboardResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

final class AdminDashboardController extends Controller
{
    public function show(Request $request): AdminDashboardResource
    {
        return new AdminDashboardResource(
            AdminDashboardQuery::for($request->user())->overview()
        );
    }
}
