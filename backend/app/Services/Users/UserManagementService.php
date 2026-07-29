<?php

namespace App\Services\Users;

use App\Actions\Users\ActivateUserAction;
use App\Actions\Users\AssignRoleAction;
use App\Actions\Users\ChangePasswordAction;
use App\Actions\Users\CreateUserAction;
use App\Actions\Users\DeleteUserAction;
use App\Actions\Users\RestoreUserAction;
use App\Actions\Users\SuspendUserAction;
use App\Actions\Users\UpdateUserAction;
use App\DTOs\Users\CreateUserData;
use App\DTOs\Users\UpdateUserData;
use App\Models\User;
use App\Support\ActionResult;


final readonly class UserManagementService
{
    public function __construct(
        private CreateUserAction $createUser,
        private UpdateUserAction $updateUser,
        private DeleteUserAction $deleteUser,
        private RestoreUserAction $restoreUser,
        private SuspendUserAction $suspendUser,
        private ActivateUserAction $activateUser,
        private AssignRoleAction $assignRole,
        private ChangePasswordAction $changePassword,
    ) {}

    public function create(CreateUserData $dto): ActionResult
{
    $user = $this->createUser->execute($dto);

    return ActionResult::success(
        $user,
        'User created successfully'
    );
}


    public function update(User $user, UpdateUserData $dto): ActionResult
    {
        $updatedUser = $this->updateUser->execute(
    $user,
    $dto
);

    return ActionResult::success(
        $updatedUser,
        'User updated successfully'
    );
    }

    public function delete(User $user): ActionResult
    {
        return $this->deleteUser->execute($user);
    }

    public function restore(int $id): ActionResult
    {
        return $this->restoreUser->execute($id);
    }

    public function suspend(User $user): ActionResult
    {
        return $this->suspendUser->execute($user);
    }

    public function activate(User $user): ActionResult
    {
        return $this->activateUser->execute($user);
    }

}