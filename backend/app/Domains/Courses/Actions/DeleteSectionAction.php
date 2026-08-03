<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Events\SectionDeleted;
use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Models\Section;
use Illuminate\Support\Facades\DB;

final class DeleteSectionAction
{
    public function __construct(
        private readonly SectionRepositoryInterface $repository,
    ) {}

    public function execute(Section $section): void
    {
        DB::transaction(function () use ($section) {

            $sectionId = $section->id;
            $courseId = $section->course_id;

            $this->repository->delete($section);

            SectionDeleted::dispatch(
                $sectionId,
                $courseId
            );
        });
    }
}