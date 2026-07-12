<?php

namespace App\Actions\Auth;

use App\Models\User;

class GetCurrentUserAction
{
    public function execute(User $user): User
    {
        return $user;
    }
}