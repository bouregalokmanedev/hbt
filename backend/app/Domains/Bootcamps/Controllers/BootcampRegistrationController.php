<?php

namespace App\Domains\Bootcamps\Controllers;

use App\Domains\Bootcamps\Resources\BootcampRegistrationResource;
use App\Enums\Bootcamps\BootcampRegistrationStatus;
use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\BootcampRegistration;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class BootcampRegistrationController extends Controller
{
    public function index(Request $request, Bootcamp $bootcamp)
    {
        $this->authorize('manageRegistrations', $bootcamp);

        $perPage = min(max($request->integer('per_page', 20), 1), 100);

        $query = $bootcamp->registrations()
            ->with('schedule')
            ->latest('created_at');

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = BootcampRegistrationStatus::tryFrom(
                $request->string('status')->toString()
            );

            abort_unless($status !== null, 422, 'Invalid status filter.');

            $query->where('status', $status->value);
        }

        return BootcampRegistrationResource::collection(
            $query->paginate($perPage)
        );
    }

    public function updateStatus(
        Request $request,
        Bootcamp $bootcamp,
        BootcampRegistration $registration,
    ): BootcampRegistrationResource {
        $this->authorize('manageRegistrations', $bootcamp);

        abort_unless($registration->bootcamp_id === $bootcamp->id, 404);

        $validated = $request->validate([
            'status' => [
                'required',
                Rule::enum(BootcampRegistrationStatus::class),
            ],
        ]);

        $registration->update([
            'status' => $validated['status'],
        ]);

        return new BootcampRegistrationResource(
            $registration->refresh()->load('schedule')
        );
    }
}
