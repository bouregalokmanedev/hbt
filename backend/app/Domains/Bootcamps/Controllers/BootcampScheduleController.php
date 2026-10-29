<?php

namespace App\Domains\Bootcamps\Controllers;

use App\Domains\Bootcamps\Requests\StoreBootcampScheduleRequest;
use App\Domains\Bootcamps\Resources\BootcampScheduleResource;
use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\BootcampSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class BootcampScheduleController extends Controller
{
    public function store(
        StoreBootcampScheduleRequest $request,
        Bootcamp $bootcamp,
    ): JsonResponse {
        $this->authorize('update', $bootcamp);

        $validated = $request->validated();

        $schedule = $bootcamp->schedules()->create([
            'starts_at' => $validated['starts_at'],
            'ends_at' => $validated['ends_at'],
        ]);

        return (new BootcampScheduleResource($schedule))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        StoreBootcampScheduleRequest $request,
        Bootcamp $bootcamp,
        BootcampSchedule $schedule,
    ): BootcampScheduleResource {
        $this->authorize('update', $bootcamp);
        $this->ensureBelongs($bootcamp, $schedule);

        $schedule->update($request->validated());

        return new BootcampScheduleResource($schedule->refresh());
    }

    public function destroy(
        Request $request,
        Bootcamp $bootcamp,
        BootcampSchedule $schedule,
    ): JsonResponse {
        $this->authorize('update', $bootcamp);
        $this->ensureBelongs($bootcamp, $schedule);

        abort_if(
            $schedule->registrations()->exists(),
            422,
            'This session already has registrations and cannot be removed.'
        );

        $schedule->delete();

        return response()->json([
            'message' => 'Bootcamp session deleted successfully.',
        ]);
    }

    private function ensureBelongs(
        Bootcamp $bootcamp,
        BootcampSchedule $schedule,
    ): void {
        abort_unless($schedule->bootcamp_id === $bootcamp->id, 404);
    }
}
