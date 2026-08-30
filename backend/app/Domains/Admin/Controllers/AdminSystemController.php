<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminSystemQuery;
use App\Domains\Admin\Resources\AdminSystemResource;
use App\Http\Controllers\Controller;

final class AdminSystemController extends Controller
{
    public function health(AdminSystemQuery $system): AdminSystemResource
    {
        return new AdminSystemResource($system->health());
    }

    public function statistics(AdminSystemQuery $system): AdminSystemResource
    {
        return new AdminSystemResource($system->statistics());
    }

    public function auditLog(AdminSystemQuery $system): AdminSystemResource
    {
        return new AdminSystemResource($system->auditLogSummary());
    }
}
