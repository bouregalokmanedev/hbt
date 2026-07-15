<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\RegisterData;
use App\Enums\UserRole;
use App\Events\UserCreated;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Enums\UserStatus;

final readonly class RegisterAction
{
    public function __construct(
        private UserRepository $users,
    ) {}

    public function execute(RegisterData $dto): ActionResult
    {
        return DB::transaction(function () use ($dto) {

            $user = $this->users->create([

                'first_name' => $dto->first_name,
                'last_name' => $dto->last_name,
                'username' => $dto->username,
                'email' => $dto->email,
                'password' => Hash::make($dto->password),
                'status'     => UserStatus::ACTIVE->value,
                'phone' => $dto->phone,
                'country' => $dto->country,
                'language' => $dto->language,
                'timezone' => $dto->timezone,

            ]);

            $user->assignRole(UserRole::STUDENT->value);

            event(new UserCreated($user));

            return ActionResult::success(
                $user,
                'Registration successful.'
            );
        });
    }
}