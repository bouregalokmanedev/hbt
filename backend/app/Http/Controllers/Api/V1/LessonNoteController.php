<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\LessonNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LessonNoteController extends Controller
{
    public function index(Request $request, Lesson $lesson): JsonResponse
    {
        return response()->json(['data' => LessonNote::query()
            ->where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->latest('updated_at')
            ->get()]);
    }

    public function store(Request $request, Lesson $lesson): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'content' => ['nullable', 'string', 'max:20000'],
        ]);

        $note = LessonNote::query()->create([...$data, 'user_id' => $request->user()->id, 'lesson_id' => $lesson->id]);

        return response()->json(['data' => $note], 201);
    }

    public function update(Request $request, Lesson $lesson, LessonNote $note): JsonResponse
    {
        abort_unless($note->user_id === $request->user()->id && $note->lesson_id === $lesson->id, 404);
        $note->update($request->validate(['title' => ['sometimes', 'required', 'string', 'max:140'], 'content' => ['nullable', 'string', 'max:20000']]));

        return response()->json(['data' => $note->fresh()]);
    }

    public function destroy(Request $request, Lesson $lesson, LessonNote $note): JsonResponse
    {
        abort_unless($note->user_id === $request->user()->id && $note->lesson_id === $lesson->id, 404);
        $note->delete();

        return response()->json(status: 204);
    }
}
