<?php

namespace App\Domains\Courses\Repositories;

use App\Models\Course;

class CourseRepository implements CourseRepositoryInterface
{
    public function create(array $data): Course
    {
        return Course::create($data);
    }

    public function publish(
    Course $course
): Course {

    $course->update([

        'status' => CourseStatus::PUBLISHED,

        'published_at' => now(),

    ]);

    return $course->refresh();

}

    public function delete(
        Course $course
    ): void {

        $course->delete();

    }

    public function find(
        string $id
    ): ?Course {

        return Course::find($id);

    }

    public function paginate(
    CourseQuery $query,
    int $perPage = 15
)
{
    $builder = Course::query();

    foreach ($query->filters() as $key => $value) {

        match ($key) {

            'status' =>

                $builder->where(
                    'status',
                    $value
                ),

            'instructor' =>

                $builder->where(
                    'instructor_id',
                    $value
                ),

            'difficulty' =>

                $builder->where(
                    'difficulty',
                    $value
                ),

            'free' =>

                $builder->where(
                    'is_free',
                    true
                ),

            'visibility' =>

                $builder->where(
                    'visibility',
                    $value
                ),

            'search' =>

                $builder->where(function($q) use($value){

                    $q->where(
                        'title',
                        'like',
                        "%{$value}%"
                    )

                    ->orWhere(
                        'description',
                        'like',
                        "%{$value}%"
                    );

                }),

            default => null

        };

    }

    return $builder->paginate($perPage);
}
}