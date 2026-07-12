<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Users\CreateUserData;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class CreateUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(CreateUserData $dto): User
    {
        return DB::transaction(function () use ($dto) {

            $user = $this->users->create(
                $dto->toArray()
            );

            $user->assignRole(UserRole::STUDENT->value);

            return $user->fresh();
        });
    }
}