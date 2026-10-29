<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Events\ModelChanged;
use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\DB;

final readonly class DeleteUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(User $user): ActionResult
    {
        if (auth()->id() === $user->id) {
            return ActionResult::failure(
                'You cannot delete your own account.'
            );
        }

        return DB::transaction(function () use ($user) {
            if (! $this->users->delete($user)) {
                return ActionResult::failure(
                    'User could not be deleted.'
                );
            }

            event(new ModelChanged(
                event: 'user.deleted',
                model: $user,
            ));

            return ActionResult::success(
                null,
                'User deleted successfully.'
            );
        });
    }
}
