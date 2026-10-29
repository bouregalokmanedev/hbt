<?php

namespace App\Domains\Bootcamps\Controllers;

use App\Domains\Bootcamps\Requests\SyncBootcampCurriculumRequest;
use App\Domains\Bootcamps\Resources\BootcampCurriculumResource;
use App\Domains\Bootcamps\Services\BootcampService;
use App\Http\Controllers\Controller;
use App\Models\Bootcamp;

final class BootcampCurriculumController extends Controller
{
    public function __construct(
        private readonly BootcampService $bootcamps,
    ) {}

    public function show(Bootcamp $bootcamp): BootcampCurriculumResource
    {
        $this->authorize('view', $bootcamp);

        return new BootcampCurriculumResource(
            $bootcamp->load('sections.lessons')
        );
    }

    public function sync(
        SyncBootcampCurriculumRequest $request,
        Bootcamp $bootcamp,
    ): BootcampCurriculumResource {
        $this->authorize('update', $bootcamp);

        $bootcamp = $this->bootcamps->syncCurriculum(
            $bootcamp,
            $request->validated()['sections']
        );

        return new BootcampCurriculumResource($bootcamp);
    }
}
