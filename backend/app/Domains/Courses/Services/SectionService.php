<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\Exceptions\InvalidSectionPosition;
use App\Domains\Courses\Exceptions\SectionCannotBePublished;
use App\Domains\Courses\Specifications\SectionPositionSpecification;
use App\Domains\Courses\Specifications\SectionPublicationSpecification;
use App\Enums\SectionStatus;
use App\Models\Section;

final class SectionService
{
    public function __construct(
        private readonly SectionPositionSpecification $positionSpecification,
        private readonly SectionPublicationSpecification $publicationSpecification,
    ) {}

    public function validate(Section $section): void
    {
        $this->validatePosition($section);

        $this->validatePublication($section);
    }

    private function validatePosition(
    Section $section
): void {
    if (
        ! $this->positionSpecification
            ->isSatisfiedBy($section->position)
    ) {
        throw new InvalidSectionPosition();
    }
}

    private function validatePublication(
        Section $section
    ): void {
        if (
            $section->status === SectionStatus::PUBLISHED
            && ! $this->publicationSpecification
                ->isSatisfiedBy($section)
        ) {
            throw new SectionCannotBePublished();
        }
    }
}