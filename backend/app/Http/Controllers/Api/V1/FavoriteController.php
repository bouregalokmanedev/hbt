<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Favorite;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');

        if ($type !== null && ! in_array($type, Favorite::TYPES, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid favorite type.',
                'errors' => ['type' => ['Type must be course or lesson.']],
            ], 422);
        }

        $favorites = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->when($type, fn ($query) => $query->where('favoritable_type', $type))
            ->latest()
            ->get();

        $courseIds = $favorites->where('favoritable_type', Favorite::TYPE_COURSE)->pluck('favoritable_id')->unique()->values();
        $lessonIds = $favorites->where('favoritable_type', Favorite::TYPE_LESSON)->pluck('favoritable_id')->unique()->values();

        $courses = $courseIds->isNotEmpty()
            ? Course::whereIn('id', $courseIds)->get()->keyBy('id')
            : collect();
        $lessons = $lessonIds->isNotEmpty()
            ? Lesson::with('section.course:id,title')->whereIn('id', $lessonIds)->get()->keyBy('id')
            : collect();

        $items = [];
        $orphanIds = [];

        foreach ($favorites as $favorite) {
            if ($favorite->favoritable_type === Favorite::TYPE_COURSE) {
                $course = $courses->get($favorite->favoritable_id);
                if (! $course) {
                    $orphanIds[] = $favorite->id;
                    continue;
                }
                $items[] = [
                    'favorite_id' => $favorite->id,
                    'type' => Favorite::TYPE_COURSE,
                    'id' => $course->id,
                    'title' => $course->title,
                    'subtitle' => $course->short_description,
                    'image' => $course->thumbnail ?? $course->cover_image,
                    'difficulty' => $course->difficulty,
                    'duration_minutes' => $course->duration_minutes,
                    'is_free' => (bool) $course->is_free,
                    'favorited_at' => $favorite->created_at?->toISOString(),
                ];
            } else {
                $lesson = $lessons->get($favorite->favoritable_id);
                if (! $lesson) {
                    $orphanIds[] = $favorite->id;
                    continue;
                }
                $items[] = [
                    'favorite_id' => $favorite->id,
                    'type' => Favorite::TYPE_LESSON,
                    'id' => $lesson->id,
                    'title' => $lesson->title,
                    'subtitle' => $lesson->description,
                    'course_id' => $lesson->section?->course_id,
                    'course_title' => $lesson->section?->course?->title,
                    'duration_minutes' => $lesson->duration_minutes,
                    'is_preview' => (bool) $lesson->is_preview,
                    'favorited_at' => $favorite->created_at?->toISOString(),
                ];
            }
        }

        if ($orphanIds !== []) {
            Favorite::whereIn('id', $orphanIds)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Favorites retrieved.',
            'data' => $items,
        ]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'in:course,lesson'],
            'id' => ['required', 'uuid'],
        ]);

        if ($data['type'] === Favorite::TYPE_COURSE) {
            $exists = Course::whereKey($data['id'])->exists();
        } else {
            $exists = Lesson::whereKey($data['id'])->exists();
        }

        if (! $exists) {
            return response()->json([
                'success' => false,
                'message' => 'The selected item does not exist.',
                'errors' => ['id' => ['The selected item does not exist.']],
            ], 422);
        }

        $favorite = Favorite::query()->where([
            'user_id' => $request->user()->id,
            'favoritable_type' => $data['type'],
            'favoritable_id' => $data['id'],
        ])->first();

        if ($favorite) {
            $favorite->delete();

            return response()->json([
                'success' => true,
                'message' => 'Removed from favourites.',
                'data' => ['favorited' => false, 'type' => $data['type'], 'id' => $data['id']],
            ]);
        }

        Favorite::create([
            'user_id' => $request->user()->id,
            'favoritable_type' => $data['type'],
            'favoritable_id' => $data['id'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Added to favourites.',
            'data' => ['favorited' => true, 'type' => $data['type'], 'id' => $data['id']],
        ], 201);
    }

    public function status(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'max:100'],
            'items.*.type' => ['required', 'string', 'in:course,lesson'],
            'items.*.id' => ['required', 'uuid'],
        ]);

        $keys = collect($data['items'])
            ->map(fn (array $item) => Favorite::key($item['type'], $item['id']))
            ->unique()
            ->values();

        $favorited = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->get(['favoritable_type', 'favoritable_id'])
            ->map(fn (Favorite $favorite) => Favorite::key($favorite->favoritable_type, $favorite->favoritable_id))
            ->intersect($keys)
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Favorite status retrieved.',
            'data' => ['favorited' => $favorited],
        ]);
    }
}
