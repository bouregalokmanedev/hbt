<?php

namespace App\Services\Users;

use App\Actions\Users\AssignRoleAction;
use App\Models\User;
use App\Support\ActionResult;

final readonly class RoleService
{
    public function __construct(
        private AssignRoleAction $assignRoleAction,
    ) {}

    public function assign(User $user, string $role): ActionResult
    {
        return $this->assignRoleAction->execute($user, $role);
    }
}