<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\Competency;
use App\Domains\StudentAssessments\Models\StudentAssessmentRecommendation;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Domains\StudentAssessments\Models\StudentCompetencyResult;

final class AssessmentRecommendationService
{
    /**
     * Generate recommendations for weak competencies.
     * Uses competency→lesson mapping for targeted learning paths.
     */
    public function generate(AssessmentAttempt $attempt, StudentAssessmentResult $studentResult, array $competencyResults): array
    {
        $recommendations = [];

        $assessment = $attempt->assessment()->with('course.sections.lessons')->first();

        foreach ($competencyResults as $cr) {
            /** @var StudentCompetencyResult $cr */
            if (($cr->percentage ?? 0) >= 70) {
                continue; // only weak competencies
            }

            // Get lessons mapped to this competency
            $competency = $cr->competency_id ? Competency::with('primaryLessons.section')->find($cr->competency_id) : null;
            $mappedLessons = $competency?->primaryLessons ?? collect();

            // Fallback to any course lesson if no mapping exists
            if ($mappedLessons->isEmpty()) {
                $mappedLessons = $assessment->course?->sections->flatMap(fn ($s) => $s->lessons) ?? collect();
            }

            // Pick highest relevance lesson
            $lesson = $mappedLessons->first();
            if (! $lesson) {
                continue;
            }

            $rec = StudentAssessmentRecommendation::create([
                'student_id' => $studentResult->student_id,
                'attempt_id' => $attempt->id,
                'assessment_result_id' => $studentResult->id,
                'competency_id' => $cr->competency_id,
                'competency_name' => $cr->competency_name,
                'course_id' => $assessment->course_id,
                'section_id' => $lesson->section_id,
                'lesson_id' => $lesson->id,
                'recommendation_type' => 'lesson_review',
                'title' => 'Review: '.$lesson->title,
                'description' => 'Strengthen competency: '.($cr->competency_name ?? 'Overall'),
                'priority' => $cr->percentage < 50 ? 'high' : 'medium',
                'reason' => 'Scored '.round($cr->percentage,1).'% — below proficiency threshold.',
                'status' => 'pending',
            ]);

            $recommendations[] = $rec;
        }

        return $recommendations;
    }

    /**
     * Get recommendations for a student based on all their weak competencies.
     * Aggregates across attempts for a learning path view.
     */
    public function getLearningPath(string $studentId, int $limit = 10): array
    {
        $weakCompetencies = \App\Domains\StudentAssessments\Models\StudentCompetencyResult::whereHas('attempt', fn ($q) => $q->where('user_id', $studentId))
            ->where('strength_level', 'weak')
            ->with('competency.primaryLessons.section')
            ->latest()
            ->get()
            ->groupBy('competency_id')
            ->map(fn ($group) => $group->first())
            ->take($limit);

        $recommendations = [];
        foreach ($weakCompetencies as $cr) {
            if ($cr->competency_id && $cr->competency && $cr->competency->primaryLessons->isNotEmpty()) {
                $lesson = $cr->competency->primaryLessons->first();
                $recommendations[] = [
                    'competency_id' => $cr->competency_id,
                    'competency_name' => $cr->competency->name,
                    'percentage' => $cr->percentage,
                    'proficiency_level' => $cr->proficiency_level,
                    'lesson' => [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'section_id' => $lesson->section_id,
                        'section_title' => $lesson->section?->title,
                    ],
                    'priority' => $cr->percentage < 50 ? 'high' : 'medium',
                ];
            }
        }

        return $recommendations;
    }

    public function forAttempt(AssessmentAttempt $attempt, $user)
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        return StudentAssessmentRecommendation::where('attempt_id', $attempt->id)
            ->with(['course:id,title', 'section:id,title', 'lesson:id,title'])
            ->get();
    }

    public function forStudent($user, int $perPage = 15)
    {
        return StudentAssessmentRecommendation::where('student_id', $user->id)
            ->with(['course:id,title', 'lesson:id,title'])
            ->latest()
            ->paginate($perPage);
    }
}
