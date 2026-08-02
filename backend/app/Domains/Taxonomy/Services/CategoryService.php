<?php

namespace App\Domains\Taxonomy\Services;

use App\Core\Domain\Services\BaseService;
use App\Domains\Taxonomy\DTOs\CreateCategoryData;
use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Domains\Taxonomy\Repositories\CategoryRepositoryInterface;
use App\Domains\Taxonomy\Specifications\CircularReferenceSpecification;
use App\Domains\Taxonomy\Specifications\ValidParentSpecification;
use App\Domains\Taxonomy\Specifications\CanDeleteCategorySpecification;
use App\Domains\Taxonomy\Exceptions\CannotDeleteRootCategoryException;
use App\Domains\Taxonomy\DTOs\UpdateCategoryData;
use App\Domains\Taxonomy\Events\CategoryUpdated;
use App\Domains\Taxonomy\Exceptions\CircularCategoryHierarchyException;
use App\Domains\Taxonomy\Exceptions\ParentCategoryNotFoundException;
use App\Domains\Taxonomy\Exceptions\InactiveParentCategoryException;
use App\Domains\Taxonomy\Exceptions\CategoryNotFoundException; 
use App\Models\Category;
use App\Domains\Taxonomy\Exceptions\CategoryHasChildrenException;
use App\Domains\Taxonomy\Exceptions\CategoryHasCoursesException;
use App\Domains\Taxonomy\Events\CategoryDeleted;
use App\Domains\Taxonomy\DTOs\AttachCategoryToCourseData;
use App\Models\Course;
use Illuminate\Support\Facades\Gate;
use App\Domains\Taxonomy\Exceptions\CourseNotFoundException;
use App\Domains\Taxonomy\Events\CategoryAttachedToCourse;
use App\Domains\Taxonomy\Events\CategoryDetachedFromCourse;
use App\Domains\Taxonomy\DTOs\DetachCategoryFromCourseData;


class CategoryService extends BaseService
{
    public function __construct(

        private readonly CategoryRepositoryInterface $categories,
        private readonly ValidParentSpecification $validParent,
        private readonly CircularReferenceSpecification $circularReference,
        private readonly CanDeleteCategorySpecification $canDelete,

    ){}

public function create(
    CreateCategoryData $dto
): Category {
    return $this->transaction(function () use ($dto) {

        $parent = null;

        if ($dto->parentId) {
    $parent = $this->categories->find($dto->parentId);

    if (! $parent) {
        throw new ParentCategoryNotFoundException();
    }

    if (! $this->validParent->isSatisfiedBy($parent)) {
        throw new InactiveParentCategoryException();
    }
}

        $category = $this->categories->create($dto);

        event(
            new CategoryCreated($category)
        );

        return $category;
    });
}

public function update(UpdateCategoryData $dto): Category
{
    $category = Category::query()->findOrFail($dto->categoryId);

    if ($dto->parentId !== null) {
        if ($dto->parentId === $category->id) {
            throw new CircularCategoryHierarchyException();
        }

        $specification = new CircularReferenceSpecification();

if (! $specification->isSatisfiedBy(
    $category,
    $dto->parentId
)) {
    throw new CircularCategoryHierarchyException();
}

        $parent = Category::query()->find($dto->parentId);

        if (! $parent) {
            throw new ParentCategoryNotFoundException();
        }

        if (! $parent->is_active) {
            throw new InactiveParentCategoryException();
        }
    }

    if ($dto->name !== null) {
        $category->name = $dto->name;
    }

    if ($dto->slug !== null) {
        $category->slug = $dto->slug;
    }

    if ($dto->description !== null) {
        $category->description = $dto->description;
    }

    if ($dto->icon !== null) {
        $category->icon = $dto->icon;
    }

    if ($dto->color !== null) {
        $category->color = $dto->color;
    }

    if ($dto->sortOrder !== null) {
        $category->sort_order = $dto->sortOrder;
    }

    if ($dto->isActive !== null) {
        $category->is_active = $dto->isActive;
    }

    if ($dto->metadata !== null) {
        $category->metadata = $dto->metadata;
    }

    // Important: null means "move to root"
    if (array_key_exists('parentId', get_object_vars($dto))) {
        $category->parent_id = $dto->parentId;
    }

    $category->save();

    event(new CategoryUpdated($category));

    return $category->fresh();
}
public function delete(
    string $categoryId
): void {

    $this->transaction(function () use ($categoryId){

        $category =

            $this->categories

                ->find($categoryId);

        if (!$category) {

            throw new CategoryNotFoundException();

        }

        if (

            $this->canDelete

                ->isRoot($category)

        ){

            throw new CannotDeleteRootCategoryException();

        }

        if(

            $this->canDelete

                ->hasChildren($category)

        ){

            throw new CategoryHasChildrenException();

        }

        if(

            $this->canDelete

                ->hasCourses($category)

        ){

            throw new CategoryHasCoursesException();

        }

        $this->categories

            ->delete($category);

        event(

            new CategoryDeleted(

                $category

            )

        );

    });

}

public function attachCourse(
    AttachCategoryToCourseData $dto
): void {
    $this->transaction(function () use ($dto) {

        $category = $this->categories->find(
            $dto->categoryId
        );

        if (! $category) {
            throw new CategoryNotFoundException();
        }

        $course = Course::find(
            $dto->courseId
        );

        if (! $course) {
            throw new CourseNotFoundException();
        }

        Gate::authorize(
            'attach',
            $category
        );

        $exists = $category
            ->courses()
            ->whereKey($course->id)
            ->exists();

        if ($exists) {
            return;
        }

        $this->categories->attachCourse(
            $category,
            $course
        );

        event(
            new CategoryAttachedToCourse(
                $course,
                $category,
                $dto->performedBy
            )
        );
    });
}
public function detachCourse(
    DetachCategoryFromCourseData $dto
): void {
    $this->transaction(function () use ($dto) {

        $category = $this->categories->find(
            $dto->categoryId
        );

        if (! $category) {
            throw new CategoryNotFoundException();
        }

        $course = Course::find(
            $dto->courseId
        );

        if (! $course) {
            throw new CourseNotFoundException();
        }

        $exists = $category
            ->courses()
            ->whereKey($course->id)
            ->exists();

        if ($exists) {
            $this->categories->detachCourse(
                $category,
                $course
            );

            event(
                new CategoryDetachedFromCourse(
                    $category,
                    $course,
                    $dto->performedBy
                )
            );
        }
    });
}
}