<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Domains\Taxonomy\Actions\CreateCategoryAction;
use App\Domains\Taxonomy\Requests\CreateCategoryRequest;
use App\Domains\Taxonomy\Resources\CategoryResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Models\Category;
use App\Domains\Taxonomy\Repositories\CategoryRepositoryInterface;
use App\Domains\Taxonomy\Actions\UpdateCategoryAction;
use App\Domains\Taxonomy\Requests\UpdateCategoryRequest;
use App\Domains\Taxonomy\Services\TreeService;
use App\Domains\Taxonomy\Resources\CategoryTreeResource;
use App\Domains\Taxonomy\Resources\BreadcrumbResource;
use App\Domains\Taxonomy\Actions\DeleteCategoryAction;
use App\Domains\Taxonomy\Requests\AttachCategoryRequest;
use App\Domains\Taxonomy\Actions\AttachCategoryToCourseAction;
use App\Domains\Taxonomy\Requests\DetachCategoryRequest;
use App\Domains\Taxonomy\Actions\DetachCategoryFromCourseAction;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
   use AuthorizesRequests;

    public function index(
    CategoryRepositoryInterface $repository
)
{
    return CategoryResource::collection(

        $repository->paginate()

    );
}

public function show(
    Category $category
)
{
    return new CategoryResource(

        $category->loadCount([

            'children',

            'courses'

        ])

    );
}

    /**
     * POST /api/v1/categories
     */
 

public function store(
    CreateCategoryRequest $request,
    CreateCategoryAction $action
): JsonResponse {
    $category = $action->execute(
        $request->toDto()
    );

    return response()->json([
        'data' => new CategoryResource($category),
    ], 201);
}
    public function update(

    UpdateCategoryRequest $request,

    UpdateCategoryAction $action,

    Category $category

)
{
    return new CategoryResource(

        $action->execute(

            $request->toDto(

                $category->id

            )

        )

    );
}
public function roots(
    CategoryRepositoryInterface $repository
) {
    return CategoryResource::collection(
        $repository->roots()
    );
}
  public function tree(
    TreeService $tree
)
{
    return CategoryTreeResource

        ::collection(

            $tree->roots()

        );
}

public function children(

    Category $category,

    TreeService $tree

)
{
    return CategoryResource

        ::collection(

            $tree->children(

                $category

            )

        );
}

public function breadcrumb(

    Category $category,

    TreeService $tree

)
{
    return BreadcrumbResource

        ::collection(

            $tree->breadcrumb(

                $category

            )

        );
}
public function destroy(
    Category $category,
    DeleteCategoryAction $action
): JsonResponse {

    $this->authorize('delete', $category);

    $action->execute(
        $category->id
    );

    return response()->json([
        'message' => 'Category deleted.',
    ]);
}
public function attach(

    AttachCategoryRequest $request,

    AttachCategoryToCourseAction $action

): JsonResponse {

    $action->execute(

        $request->toDto()

    );

    return response()->json([

        'message'=>

            'Category attached.'

    ]);

}
public function detach(
    DetachCategoryRequest $request,
    DetachCategoryFromCourseAction $action
): JsonResponse {
    $action->execute(
        $request->toDto()
    );

    return response()->json([
        'message' => 'Category detached.'
    ]);
}
}