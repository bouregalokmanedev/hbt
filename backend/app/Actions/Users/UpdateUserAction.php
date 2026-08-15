<?php

namespace App\Actions\Users;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\DTOs\Users\UpdateUserData;
use App\Events\ModelChanged;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class UpdateUserAction
{
    public function __construct(
        private UserRepositoryInterface $users
    ) {}

    public function execute(
        User $user,
        UpdateUserData $dto
    ): User {
        return DB::transaction(function () use ($user, $dto) {
            $old = $user->only([
                'first_name',
                'last_name',
                'username',
                'email',
                'phone',
                'country',
                'bio',
                'avatar',
                'language',
                'timezone',
                'status',
            ]);

            $updatedUser = $this->users->update(
                $user,
                [
                    'first_name' => $dto->firstName,
                    'last_name' => $dto->lastName,
                    'username' => $dto->username,
                    
                    'phone' => $dto->phone,
                    'country' => $dto->country,
                    'bio' => $dto->bio,
                    'avatar' => $dto->avatar,
                    'language' => $dto->language,
                    'timezone' => $dto->timezone,
                ]
            );

            event(new ModelChanged(
                event: 'user.updated',
                model: $updatedUser,
                old: $old,
                new: $updatedUser->fresh()->only([
                    'first_name',
                    'last_name',
                    'username',
                    'email',
                    'phone',
                    'country',
                    'bio',
                    'avatar',
                    'language',
                    'timezone',
                    'status',
                ]),
            ));

            return $updatedUser->fresh();
        });
    }
}