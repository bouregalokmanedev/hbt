<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\RegisterData;
use App\Enums\UserRole;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Enums\UserStatus;
use App\Events\ModelChanged;
use App\Domains\Students\Services\StudentSettingsService;
use Illuminate\Support\Str;

final readonly class RegisterAction
{
    public function __construct(
        private UserRepository $users,
        private readonly StudentSettingsService $studentSettingsService,
    ) {}

    public function execute(RegisterData $dto): ActionResult
    {
        return DB::transaction(function () use ($dto) {

            $user = $this->users->create([

                'first_name' => $dto->first_name,
                'last_name' => $dto->last_name,
                // A private placeholder satisfies the legacy unique column;
                // learners choose their visible username later on Profile.
                'username' => $this->uniqueUsername($dto->first_name, $dto->last_name),
                'email' => $dto->email,
                'password' => Hash::make($dto->password),
                'status' => UserStatus::PENDING->value,
                'phone' => $dto->phone,
                'country' => $dto->country,
                'language' => $dto->language,
                'timezone' => $dto->timezone,

            ]);

            $user->assignRole(UserRole::STUDENT->value);

            $this->studentSettingsService->initializeFor($user);

            event(new ModelChanged(event: 'user.created',model: $user,));

            return ActionResult::success(
                $user,
                'Registration successful.'
            );
        });
    }

    private function uniqueUsername(string $firstName, string $lastName): string
    {
        $base = Str::of($firstName . '-' . $lastName)
            ->lower()
            ->ascii()
            ->replaceMatches('/[^a-z0-9-]+/', '-')
            ->trim('-')
            ->substr(0, 22)
            ->value() ?: 'learner';

        $candidate = $base;
        $suffix = 1;
        while (User::withTrashed()->where('username', $candidate)->exists()) {
            $candidate = Str::limit($base, 30 - strlen((string) $suffix) - 1, '') . '-' . $suffix;
            $suffix++;
        }

        return $candidate;
    }
}
