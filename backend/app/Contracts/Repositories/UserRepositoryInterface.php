<?php

namespace App\Contracts\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    /**
     * Get all users.
     */
    public function all(): Collection;

    /**
     * Find a user by ID.
     */
    public function findById(int $id): ?User;

    /**
     * Find a user by UUID.
     */
    public function findByUuid(string $uuid): ?User;

    /**
     * Find a user by email.
     */
    public function findByEmail(string $email): ?User;

    /**
     * Find a user by username.
     */
    public function findByUsername(string $username): ?User;

    /**
     * Create a new user.
     */
    public function create(array $data): User;

    /**
     * Update an existing user.
     */
    public function update(User $user, array $data): User;

    /**
     * Delete a user (Soft Delete).
     */
    public function delete(User $user): bool;
}