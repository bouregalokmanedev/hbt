<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Users\UpdateUserData;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(
        User $user,
        UpdateUserData $dto
    ): User {

        return DB::transaction(function () use ($user, $dto) {

            ActionResult::success(
    $updatedUser,
    'User updated successfully.'
);

        });
    }
}