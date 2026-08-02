<?php

namespace App\Domains\Taxonomy\Policies;

use App\Models\Category;
use App\Models\User;




class CategoryPolicy
{
    /**
     * Create a category.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'Admin',
            'Super Admin',
        ]);
    }

    /**
     * Update a category.
     */
    public function update(
        User $user,
        Category $category
    ): bool {
        return $user->hasAnyRole([
            'Admin',
            'Super Admin',
        ]);
    }

    /**
     * Delete a category.
     */
    public function delete(
        User $user,
        Category $category
    ): bool {
        return $user->hasAnyRole([
            'Admin',
            'Super Admin',
        ]);
    }

    

    /**
     * Attach a category to a course.
     */
    public function attach(
    User $user,
    Category $category
): bool {
    return $user->hasRole('Admin');
}

    /**
     * Detach a category from a course.
     */
   public function detach(
    User $user,
    Category $category
): bool {
    return $user->hasRole('Admin');
}

    public function destroy(
    Category $category,
    DeleteCategoryAction $action
): JsonResponse {

    $this->authorize('delete', $category);

    $action->execute($category->id);

    return response()->json([
        'message' => 'Category deleted.',
    ]);
}
}