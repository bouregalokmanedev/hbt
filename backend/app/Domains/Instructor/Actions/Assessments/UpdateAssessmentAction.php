<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Models\User;
use LogicException;

final class UpdateAssessmentAction
{
    public function execute(Assessment $assessment, User $instructor, array $data): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only update assessments for your own courses.');
        }

        $fillable = [
            'title',
            'description',
            'minimum_score',
            'required_quiz_score',
            'required_scenarios',
            'max_attempts',
            'is_required',
            'assessment_mode',
            'interaction_types',
            'proficiency_thresholds',
            'adaptive_config',
            'section_id',
            'lesson_id',
        ];

        foreach ($fillable as $field) {
            if (array_key_exists($field, $data)) {
                $assessment->{$field} = $data[$field];
            }
        }

        $this->validateScope($assessment);

        // Regenerate slug if title changed
        if (isset($data['title']) && $data['title'] !== $assessment->title) {
            $slug = \Illuminate\Support\Str::slug($data['title']);
            $originalSlug = $slug;
            $counter = 1;
            while (Assessment::where('course_id', $assessment->course_id)
                ->where('slug', $slug)
                ->where('id', '!=', $assessment->id)
                ->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }
            $assessment->slug = $slug;
        }

        $assessment->save();

        return $assessment->fresh();
    }

    /**
     * Scope must stay inside the assessment's course, and a lesson
     * scope must sit inside the section scope when both are set.
     */
    private function validateScope(Assessment $assessment): void
    {
        if ($assessment->section_id !== null) {
            $section = \App\Models\Section::find($assessment->section_id);

            if (! $section || $section->course_id !== $assessment->course_id) {
                throw new LogicException('The section must belong to the assessment course.');
            }
        }

        if ($assessment->lesson_id !== null) {
            $lesson = \App\Models\Lesson::with('section')->find($assessment->lesson_id);

            if (! $lesson || $lesson->section->course_id !== $assessment->course_id) {
                throw new LogicException('The lesson must belong to the assessment course.');
            }

            if ($assessment->section_id !== null && $lesson->section_id !== $assessment->section_id) {
                throw new LogicException('The lesson must belong to the assessment section.');
            }
        }
    }
}