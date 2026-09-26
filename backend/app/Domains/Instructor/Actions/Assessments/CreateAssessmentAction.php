<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Enums\AssessmentMode;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class CreateAssessmentAction
{
    public function execute(Course $course, User $instructor, array $data): Assessment
    {
        return DB::transaction(function () use ($course, $instructor, $data) {
            if ($course->instructor_id !== $instructor->id) {
                throw new LogicException('You can only create assessments for your own courses.');
            }

            $slug = \Illuminate\Support\Str::slug($data['title']);
            $originalSlug = $slug;
            $counter = 1;
            while (Assessment::where('course_id', $course->id)->where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            // Attempt budget defaults to the assessment mode unless the
            // instructor sets it explicitly (including explicitly null
            // for unlimited attempts).
            $mode = AssessmentMode::tryFrom($data['assessment_mode'] ?? '') ?? AssessmentMode::SUMMATIVE;

            $this->validateScope($course->id, $data['section_id'] ?? null, $data['lesson_id'] ?? null);

            return Assessment::create([
                'course_id' => $course->id,
                'section_id' => $data['section_id'] ?? null,
                'lesson_id' => $data['lesson_id'] ?? null,
                'title' => $data['title'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'minimum_score' => $data['minimum_score'] ?? 80,
                'required_quiz_score' => $data['required_quiz_score'] ?? 70,
                'required_scenarios' => $data['required_scenarios'] ?? 0,
                'max_attempts' => array_key_exists('max_attempts', $data) ? $data['max_attempts'] : $mode->defaultMaxAttempts(),
                'is_required' => $data['is_required'] ?? true,
                'assessment_mode' => $data['assessment_mode'] ?? 'summative',
                'interaction_types' => $data['interaction_types'] ?? ['knowledge'],
                'proficiency_thresholds' => $data['proficiency_thresholds'] ?? null,
                'adaptive_config' => $data['adaptive_config'] ?? null,
                'status' => AssessmentStatus::DRAFT,
            ]);
        });
    }

    private function validateScope(string $courseId, ?string $sectionId, ?string $lessonId): void
    {
        if ($sectionId !== null) {
            $section = \App\Models\Section::find($sectionId);

            if (! $section || $section->course_id !== $courseId) {
                throw new LogicException('The section must belong to the assessment course.');
            }
        }

        if ($lessonId !== null) {
            $lesson = \App\Models\Lesson::with('section')->find($lessonId);

            if (! $lesson || $lesson->section->course_id !== $courseId) {
                throw new LogicException('The lesson must belong to the assessment course.');
            }

            if ($sectionId !== null && $lesson->section_id !== $sectionId) {
                throw new LogicException('The lesson must belong to the assessment section.');
            }
        }
    }
}