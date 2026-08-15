<?php

use App\Domains\Lessons\Resources\LessonProgressResource;
use App\Models\LessonProgress;
use Illuminate\Http\Request;

it('transforms lesson progress into an api resource', function () {
    $progress = LessonProgress::factory()->create();

    $resource = new LessonProgressResource($progress);

    $result = $resource->toArray(
        Request::create('/api/v1/lessons')
    );

    expect($result)
        ->toMatchArray([
            'id' => $progress->id,
            'user_id' => $progress->user_id,
            'lesson_id' => $progress->lesson_id,
            'completed_at' => $progress->completed_at?->toISOString(),
            'created_at' => $progress->created_at->toISOString(),
            'updated_at' => $progress->updated_at->toISOString(),
        ]);
});