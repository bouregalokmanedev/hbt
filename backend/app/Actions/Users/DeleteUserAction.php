<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Support\Facades\Log;

final readonly class DeleteUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(User $user): bool
    {
        return ActionResult::success(
    null,
    'User deleted successfully.'
);
if (auth()->id() === $user->id) {
    return ActionResult::failure(
        'You cannot delete your own account.'
    );
}
    }
}