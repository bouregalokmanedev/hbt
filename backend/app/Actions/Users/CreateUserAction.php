<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Users\CreateUserData;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Support\ActionResult;
use App\Events\UserCreated;
use Illuminate\Support\Facades\Log;

final readonly class CreateUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(CreateUserData $dto): ActionResult
    {
        return DB::transaction(function () use ($dto) {

    $user = $this->users->create(
        $dto->toArray()
    );

    $user->assignRole(UserRole::STUDENT->value);

    return ActionResult::success(
        data: $user->fresh(),
        message: 'User created successfully.'
    );

});
    }
}