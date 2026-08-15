<?php

use App\Domains\Courses\Repositories\EloquentSectionProgressRepository;
use App\Domains\Courses\Repositories\SectionProgressRepositoryInterface;

it('resolves the section progress repository from the container', function () {
    $repository = app(SectionProgressRepositoryInterface::class);

    expect($repository)
        ->toBeInstanceOf(EloquentSectionProgressRepository::class);
});