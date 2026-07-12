<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Models\User;

final readonly class DeleteUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(User $user): bool
    {
        return $this->users->delete($user);
    }
}