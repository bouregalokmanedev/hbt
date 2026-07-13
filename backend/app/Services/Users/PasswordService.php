<?php

namespace App\Services\Users;

use App\Actions\Users\ChangePasswordAction;
use App\Models\User;
use App\Support\ActionResult;

final readonly class PasswordService
{
    public function __construct(
        private ChangePasswordAction $changePasswordAction,
    ) {}

    public function change(
        User $user,
        string $password
    ): ActionResult {

        return $this->changePasswordAction->execute(
            $user,
            $password
        );
    }
}