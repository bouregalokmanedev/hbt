<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Marketing\Models\FeaturedCourse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FeaturedCourseController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => FeaturedCourse::query()->with('course:id,title,slug')->orderBy('position')->get()->map(fn (FeaturedCourse $item) => $this->serialize($item)),
        ]);
    }

    /**
     * Public merchandising feed for landing and catalog highlights.
     */
    public function featured(): JsonResponse
    {
        return response()->json([
            'data' => FeaturedCourse::query()
                ->where('active', true)
                ->with(['course' => fn ($query) => $query->where('status', 'published')])
                ->orderBy('position')
                ->get()
                ->filter(fn (FeaturedCourse $item) => $item->course !== null)
                ->values()
                ->map(fn (FeaturedCourse $item) => [
                    'course_id' => $item->course_id,
                    'badge_label' => $item->badge_label,
                    'title' => $item->course->title,
                    'slug' => $item->course->slug,
                ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'course_id' => ['required', 'uuid', 'exists:courses,id', 'unique:featured_courses,course_id'],
            'position' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'badge_label' => ['nullable', 'string', 'max:60'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $item = FeaturedCourse::query()->create($data);

        return response()->json(['data' => $this->serialize($item->fresh('course'))], 201);
    }

    public function update(Request $request, FeaturedCourse $featuredCourse): JsonResponse
    {
        $data = $request->validate([
            'position' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'badge_label' => ['nullable', 'string', 'max:60'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $featuredCourse->update($data);

        return response()->json(['data' => $this->serialize($featuredCourse->fresh('course'))]);
    }

    public function destroy(FeaturedCourse $featuredCourse): JsonResponse
    {
        $featuredCourse->delete();

        return response()->json(['message' => 'Featured slot removed.']);
    }

    private function serialize(FeaturedCourse $item): array
    {
        return [
            'id' => $item->id,
            'course_id' => $item->course_id,
            'course_title' => $item->course?->title,
            'position' => $item->position,
            'badge_label' => $item->badge_label,
            'active' => (bool) $item->active,
        ];
    }
}
