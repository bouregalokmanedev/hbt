<?php

namespace App\Domains\Taxonomy\Repositories;

use App\Domains\Taxonomy\DTOs\CreateCategoryData;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CategoryRepository implements CategoryRepositoryInterface
{
    public function create(CreateCategoryData $data): Category
{
    return Category::create([
        'parent_id' => $data->parentId,
        'name' => $data->name,
        'slug' => $data->slug,
        'description' => $data->description,
        'icon' => $data->icon,
        'color' => $data->color,
        'sort_order' => $data->sortOrder,
        'is_active' => $data->isActive,
        'metadata' => $data->metadata,
    ]);
}

    public function update(
        Category $category,
        array $attributes
    ): Category {
        $category->update($attributes);

        return $category->refresh();
    }

   public function delete(Category $category): void
{
    $category->forceDelete();
}

    public function find(string $id): ?Category
    {
        return Category::find($id);
    }

    public function findBySlug(string $slug): ?Category
    {
        return Category::whereSlug($slug)->first();
    }

    public function roots()
    {
        return Category::whereNull('parent_id')
            ->orderBy('sort_order')
            ->get();
    }

    public function children(Category $category)
    {
        return $category->children()
            ->orderBy('sort_order')
            ->get();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Category::orderBy('sort_order')
            ->paginate($perPage);
    }

    public function attachCourse(
        Category $category,
        Course $course
    ): void {
        $category
            ->courses()
            ->syncWithoutDetaching([
                $course->id,
            ]);
    }

    public function detachCourse(
        Category $category,
        Course $course
    ): void {
        $category
            ->courses()
            ->detach($course->id);
    }

    public function isDescendantOf(
        Category $category,
        string $possibleAncestorId
    ): bool {
        $current = $category;

        while ($current->parent_id !== null) {
            if ($current->parent_id === $possibleAncestorId) {
                return true;
            }

            $current = $this->find($current->parent_id);

            if ($current === null) {
                break;
            }
        }

        return false;
    }
}