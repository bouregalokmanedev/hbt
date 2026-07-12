<?php

namespace App\Actions\Users;

use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use App\Enums\UserRole;
use Illuminate\Support\Facades\Log;

final readonly class AssignRoleAction
{
    public function execute(
        User $user,
        string $role
    ): ActionResult {

        return DB::transaction(function () use ($user, $role) {

            if (! Role::where('name', $role)->exists()) {
                return ActionResult::failure(
                    'Role does not exist.'
                );
            }

            if (
    $role === UserRole::SUPER_ADMIN->value &&
    ! auth()->user()?->hasRole(UserRole::SUPER_ADMIN->value)
) {
    return ActionResult::failure(
        'Only Super Admin can assign this role.'
    );
}

            $user->syncRoles([$role]);

            return ActionResult::success(
                $user->fresh(),
                'Role assigned successfully.'
            );
        });

    }
}