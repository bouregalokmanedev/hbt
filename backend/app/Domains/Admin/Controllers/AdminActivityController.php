<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminActivityQuery;
use App\Domains\Admin\Resources\AdminActivityResource;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

final class AdminActivityController extends Controller
{
    public function index(Request $request)
    {
        return AdminActivityResource::collection(
            app(AdminActivityQuery::class)->paginate(
                $request->only([
                    'search', 'actor', 'event', 'target_type', 'date_from', 'date_to',
                ]),
                $request->integer('per_page', 25),
            )
        );
    }

    public function show(AuditLog $activity): AdminActivityResource
    {
        return new AdminActivityResource(
            $activity->load('user:id,uuid,first_name,last_name,email')
        );
    }
}
