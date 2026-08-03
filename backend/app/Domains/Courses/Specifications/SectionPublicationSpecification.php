<?php

namespace App\Domains\Courses\Specifications;

use App\Enums\SectionStatus;
use App\Models\Section;

final class SectionPublicationSpecification
{
    public function isSatisfiedBy(
        Section $section
    ): bool {
        if ($section->status !== SectionStatus::PUBLISHED) {
            return true;
        }

        return filled($section->title)
            && filled($section->slug)
            && $section->course_id !== null
            && $section->position >= 1;
    }
}