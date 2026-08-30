<?php

namespace App\Domains\Courses\Resources;

use App\Domains\Lessons\Resources\CurriculumLessonResource;
use App\Domains\Quizzes\Http\Resources\QuizResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'position' => $this->position,
            'status' => $this->status->value,

            'lessons' => CurriculumLessonResource::collection(
                $this->whenLoaded('lessons')
            ),

            'quizzes' => QuizResource::collection(
                $this->whenLoaded('quizzes')
            ),
        ];
    }
}
