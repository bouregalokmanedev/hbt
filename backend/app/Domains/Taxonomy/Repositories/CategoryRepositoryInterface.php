<?php

namespace App\Domains\Taxonomy\Repositories;

use App\Domains\Taxonomy\DTOs\CreateCategoryData;
use App\Models\Category;
use App\Models\Course;

interface CategoryRepositoryInterface
{

public function create(CreateCategoryData $data): Category;

    public function update(
        Category $category,
        array $attributes
    ): Category;

    public function delete(Category $category): void;

    public function find(string $id): ?Category;

    public function findBySlug(string $slug): ?Category;

    public function roots();

    public function children(Category $category);

    public function paginate(int $perPage = 15);

    public function attachCourse(
        Category $category,
        Course $course
    ): void;

    public function detachCourse(
        Category $category,
        Course $course
    ): void;

    public function isDescendantOf(
        Category $category,
        string $possibleAncestorId
    ): bool;
}