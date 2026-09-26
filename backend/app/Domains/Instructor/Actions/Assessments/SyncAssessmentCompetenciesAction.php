<?php

namespace App\Domains\Instructor\Actions\Assessments;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\Competency;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class SyncAssessmentCompetenciesAction
{
    public function execute(Assessment $assessment, User $instructor, array $competencies): Assessment
    {
        if ($assessment->course->instructor_id !== $instructor->id) {
            throw new LogicException('You can only manage competencies for your own course assessments.');
        }

        return DB::transaction(function () use ($assessment, $competencies) {
            // Delete existing mappings
            $assessment->competencies()->detach();

            // Create new mappings
            foreach ($competencies as $index => $competencyData) {
                $competency = Competency::find($competencyData['competency_id']);
                if (! $competency) {
                    throw new LogicException("Competency {$competencyData['competency_id']} not found.");
                }

                $assessment->competencies()->attach($competency->id, [
                    'position' => $competencyData['position'] ?? $index + 1,
                    'weight' => $competencyData['weight'] ?? 1.0,
                ]);
            }

            return $assessment->fresh()->load('competencies');
        });
    }
}