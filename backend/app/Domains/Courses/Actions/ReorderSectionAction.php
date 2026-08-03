<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Events\SectionReordered;
use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Models\Section;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ReorderSectionAction
{
    public function __construct(
        private readonly SectionRepositoryInterface $repository,
    ) {}

    public function execute(
        Section $section,
        int $newPosition
    ): Section {
        if ($newPosition < 1) {
            throw new InvalidArgumentException(
                'Section position must be greater than or equal to 1.'
            );
        }

        return DB::transaction(function () use (
            $section,
            $newPosition
        ) {
            $section = $section->fresh();

            $sections = $this->repository
                ->findByCourse($section->course_id);

            $maxPosition = $sections->count();

            if ($newPosition > $maxPosition) {
                throw new InvalidArgumentException(
                    'The new section position is outside the course range.'
                );
            }

            $currentPosition = $section->position;

            if ($currentPosition === $newPosition) {
                return $section;
            }

            $orderedSections = $sections
                ->reject(fn (Section $item) => $item->id === $section->id)
                ->values();

            $orderedSections->splice(
                $newPosition - 1,
                0,
                [$section]
            );

            /*
             * Temporarily move every section outside the valid
             * position range to avoid unique constraint violations.
             */
            foreach ($orderedSections as $index => $item) {
                $item->update([
                    'position' => -($index + 1),
                ]);
            }

            /*
             * Assign final contiguous positions.
             */
            foreach ($orderedSections as $index => $item) {
                $item->update([
                    'position' => $index + 1,
                ]);
            }

            $updatedSection = $section->fresh();

            SectionReordered::dispatch(
                $updatedSection,
                $currentPosition,
                $newPosition,
            );

            return $updatedSection;
        });
    }
}