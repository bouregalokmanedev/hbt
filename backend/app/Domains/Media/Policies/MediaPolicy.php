<?php

namespace App\Domains\Media\Policies;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Media;
use App\Models\User;

final class MediaPolicy
{
    public function create(
        User $user,
        string $mediableType,
        string $mediableId
    ): bool {
        if ($user->hasAnyRole([
            'Admin',
            'Super Admin',
        ])) {
            return true;
        }

        $model = $mediableType::query()->find($mediableId);

        if (! $model) {
            return false;
        }

        return $this->ownsMediable(
            $user,
            $model
        );
    }
    public function view(
    User $user,
    Media $media
): bool {
    if ($user->hasAnyRole([
        'Admin',
        'Super Admin',
    ])) {
        return true;
    }

    return $this->ownsMediable(
        $user,
        $media->mediable
    );
}

    public function delete(
        User $user,
        Media $media
    ): bool {
        if ($user->hasAnyRole([
            'Admin',
            'Super Admin',
        ])) {
            return true;
        }

        return $this->ownsMediable(
            $user,
            $media->mediable
        );
    }

    private function ownsMediable(
        User $user,
        mixed $model
    ): bool {
        if ($model instanceof Course) {
            return $model->instructor_id === $user->id;
        }

        if ($model instanceof Lesson) {
            return $model
                ->section
                ->course
                ->instructor_id === $user->id;
        }

        return false;
    }
}
