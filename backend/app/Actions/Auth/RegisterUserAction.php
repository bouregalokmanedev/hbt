<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\RegisterUserData;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\DB;

use App\Enums\UserRole;


class RegisterUserAction
{
    public function __construct(
        protected UserRepository $users
    ) {}

    public function execute(RegisterUserData $dto): array
    {
        return DB::transaction(function () use ($dto) {

            $user = $this->users->create(
                $dto->toArray()
            );

            $user->assignRole(UserRole::STUDENT->value);

            $token = $user
                ->createToken('auth_token')
                ->plainTextToken;

            return [
                'user' => $user,
                'token' => $token,
            ];

        });
    }
}