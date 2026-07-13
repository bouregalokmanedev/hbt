<?php

namespace App\Actions\Users;
use Illuminate\Support\Facades\Log;

use App\Contracts\Repositories\UserRepositoryInterface;

final readonly class RestoreUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(int $id): bool
    {
        return ActionResult::success(
    null,
    'User restored successfully.'
);
    }
}