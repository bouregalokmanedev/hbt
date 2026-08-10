<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Courses\Queries\CourseQuery;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Resources\CourseResource;
use App\Enums\Courses\Difficulty;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

final class CatalogController extends Controller
{
    public function __construct(
        private readonly CourseRepositoryInterface $courses,
    ) {
    }

    public function courses(Request $request)
    {
        $query = CourseQuery::make()
            ->catalog();

        if ($request->filled('search')) {
            $query->search(
                $request->string('search')->toString()
            );
        }

        if ($request->filled('difficulty')) {
            $query->difficulty(
                Difficulty::from(
                    $request->string('difficulty')->toString()
                )
            );
        }

        if ($request->boolean('free')) {
            $query->free();
        }

        if ($request->filled('language')) {
            $query->language(
                $request->string('language')->toString()
            );
        }

        if ($request->filled('category')) {
            $query->category(
                $request->string('category')->toString()
            );
        }

        $perPage = min(
            max(
                $request->integer('per_page', 15),
                1
            ),
            100
        );

        return CourseResource::collection(
            $this->courses->paginate(
                $query,
                $perPage
            )
        );
    }
}
