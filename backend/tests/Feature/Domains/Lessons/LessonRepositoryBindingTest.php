<?php

use App\Domains\Lessons\Repositories\EloquentLessonRepository;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;

it('resolves the lesson repository from the container', function () {
    $repository = app(
        LessonRepositoryInterface::class
    );

    expect($repository)
        ->toBeInstanceOf(
            EloquentLessonRepository::class
        );
});