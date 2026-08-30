<?php

namespace Database\Seeders;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\Course;
use Illuminate\Database\Seeder;

final class AutomotiveAssessmentSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::query()->with('sections')->first();
        $section = $course?->sections->first();
        if ($course === null || $section === null) return;

        $quiz = Quiz::query()->firstOrCreate(
            ['section_id' => $section->id, 'slug' => 'ecu-foundations-checkpoint'],
            ['title' => 'ECU foundations checkpoint', 'description' => 'Confirm your understanding of ECU inputs, outputs, and diagnostic data.', 'position' => 99, 'status' => 'published', 'pass_percentage' => 70, 'max_attempts' => 3, 'time_limit' => 10],
        );
        $questions = [
            ['question' => 'Which sensor commonly provides engine speed and crankshaft position data to the ECU?', 'options' => [['Crankshaft position sensor', true], ['Coolant temperature sensor', false], ['Throttle position sensor', false], ['Oxygen sensor', false]]],
            ['question' => 'What is the main purpose of a diagnostic trouble code?', 'options' => [['Identify a monitored circuit or system fault', true], ['Replace a failed component automatically', false], ['Set ignition timing manually', false], ['Disable the ECU', false]]],
            ['question' => 'Before replacing a component for a circuit DTC, what should be checked first?', 'options' => [['Power, ground, wiring, and connector condition', true], ['The battery label', false], ['The vehicle paint code', false], ['The radio settings', false]]],
        ];
        foreach ($questions as $position => $data) {
            $question = QuizQuestion::query()->firstOrCreate(['quiz_id' => $quiz->id, 'position' => $position + 1], ['question' => $data['question'], 'type' => 'single_choice', 'points' => 1, 'required' => true]);
            foreach ($data['options'] as $optionPosition => [$option, $correct]) QuizQuestionOption::query()->firstOrCreate(['quiz_question_id' => $question->id, 'position' => $optionPosition + 1], ['option' => $option, 'is_correct' => $correct]);
        }
        $assessment = Assessment::query()->firstOrCreate(
            ['course_id' => $course->id, 'slug' => 'engine-management-final-assessment'],
            ['title' => 'Engine management final assessment', 'description' => 'Demonstrate that you can interpret ECU inputs and follow a safe diagnostic process.', 'minimum_score' => 80, 'required_quiz_score' => 70, 'required_scenarios' => 0, 'max_attempts' => 3, 'is_required' => true, 'status' => 'published', 'published_at' => now()],
        );
        $assessment->quizzes()->syncWithoutDetaching([$quiz->id => ['position' => 1, 'is_required' => true]]);
        $assessment->questions()->syncWithoutDetaching(QuizQuestion::query()->where('quiz_id', $quiz->id)->pluck('id')->mapWithKeys(fn ($id, $index) => [$id => ['position' => $index + 1, 'points' => 1]])->all());
    }
}
