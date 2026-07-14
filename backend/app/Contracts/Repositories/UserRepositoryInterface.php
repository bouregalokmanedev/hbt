<?php

namespace App\Contracts\Repositories;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;



interface UserRepositoryInterface
{
    public function create(array $data): User;

    public function update(User $user, array $data): User;

    public function delete(User $user): bool;

    public function restore(int $id): bool;

    public function findById(int $id): ?User;

    public function findByUuid(string $uuid): ?User;

    public function findByEmail(string $email): ?User;

    public function findByUsername(string $username): ?User;

    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;
}