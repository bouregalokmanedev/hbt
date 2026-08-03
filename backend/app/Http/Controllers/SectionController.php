<?php

namespace App\Http\Controllers;

use App\Domains\Courses\Actions\CreateSectionAction;
use App\Domains\Courses\Actions\DeleteSectionAction;
use App\Domains\Courses\Actions\PublishSectionAction;
use App\Domains\Courses\Actions\ReorderSectionAction;
use App\Domains\Courses\Actions\UnpublishSectionAction;
use App\Domains\Courses\Actions\UpdateSectionAction;
use App\Domains\Courses\Requests\CreateSectionRequest;
use App\Domains\Courses\Requests\ReorderSectionRequest;
use App\Domains\Courses\Requests\UpdateSectionRequest;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;


final class SectionController extends Controller

{
    public function __construct(
        private readonly CreateSectionAction $createSection,
        private readonly UpdateSectionAction $updateSection,
        private readonly DeleteSectionAction $deleteSection,
        private readonly PublishSectionAction $publishSection,
        private readonly UnpublishSectionAction $unpublishSection,
        private readonly ReorderSectionAction $reorderSection,
    ) {}

    public function store(
        CreateSectionRequest $request
    ): JsonResponse {
        $section = $this->createSection->execute(
            $request->validated()
        );

        return response()->json($section, 201);
    }

    public function update(
        UpdateSectionRequest $request,
        Section $section
    ): JsonResponse {
        Gate::authorize('update', $section);

        $section = $this->updateSection->execute(
            $section,
            $request->validated()
        );

        return response()->json($section);
    }

    public function destroy(
        Section $section
    ): JsonResponse {
        Gate::authorize('delete', $section);

        $this->deleteSection->execute($section);

        return response()->json(
            status: 204
        );
    }

    public function publish(
        Section $section
    ): JsonResponse {
        Gate::authorize('publish', $section);

        $section = $this->publishSection->execute(
            $section
        );

        return response()->json($section);
    }

    public function unpublish(
        Section $section
    ): JsonResponse {
       Gate::authorize('unpublish', $section);

        $section = $this->unpublishSection->execute(
            $section
        );

        return response()->json($section);
    }

    public function reorder(
        ReorderSectionRequest $request,
        Section $section
    ): JsonResponse {
        Gate::authorize('reorder', $section);

        $section = $this->reorderSection->execute(
            $section,
            $request->validated('position')
        );

        return response()->json($section);
    }
}