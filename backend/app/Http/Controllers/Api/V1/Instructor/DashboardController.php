<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Instructor\Queries\InstructorDashboardQuery;
use App\Domains\Instructor\Resources\InstructorDashboardResource;
use App\Http\Controllers\Controller;

final class DashboardController extends Controller
{
    public function show(): InstructorDashboardResource
    {
        $instructorId = (int) auth()->id();

        return new InstructorDashboardResource(
            InstructorDashboardQuery::for(
                $instructorId
            )->overview()
        );
    }
}