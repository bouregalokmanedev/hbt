<?php

namespace Database\Seeders;

use App\Domains\Challenges\Models\DailyChallengeDef;
use Illuminate\Database\Seeder;

/**
 * One challenge per LMS / diagnostics / simulator action. Idempotent.
 */
class DailyChallengeSeeder extends Seeder
{
    public function run(): void
    {
        $defs = [
            [
                'key' => 'lesson-complete',
                'title' => 'Complete a lesson',
                'description' => 'Finish any lesson in your courses today.',
                'action' => 'lesson_complete',
                'route' => '/my-courses',
                'xp' => 20,
                'target' => 1,
                'sort' => 1,
            ],
            [
                'key' => 'section-complete',
                'title' => 'Complete a section',
                'description' => 'Finish every lesson in a course section.',
                'action' => 'section_complete',
                'route' => '/my-courses',
                'xp' => 30,
                'target' => 1,
                'sort' => 2,
            ],
            [
                'key' => 'quiz-complete',
                'title' => 'Pass a quiz',
                'description' => 'Submit a quiz attempt and pass.',
                'action' => 'quiz_complete',
                'route' => '/my-courses',
                'xp' => 25,
                'target' => 1,
                'sort' => 3,
            ],
            [
                'key' => 'diagnostic-complete',
                'title' => 'Finish a diagnostic scenario',
                'description' => 'Submit a diagnostic attempt from the lab.',
                'action' => 'diagnostic_complete',
                'route' => '/diagnostics',
                'xp' => 35,
                'target' => 1,
                'sort' => 4,
            ],
            [
                'key' => 'simulator-complete',
                'title' => 'Complete a simulator lab',
                'description' => 'Finish a bench session in any of the 5 labs.',
                'action' => 'simulator_complete',
                'route' => '/simulator',
                'xp' => 30,
                'target' => 1,
                'sort' => 5,
            ],
            [
                'key' => 'simulator-double',
                'title' => 'Two simulator sessions',
                'description' => 'Complete two bench sessions today for bonus XP.',
                'action' => 'simulator_complete',
                'route' => '/simulator',
                'xp' => 40,
                'target' => 2,
                'sort' => 6,
            ],
        ];

        foreach ($defs as $def) {
            DailyChallengeDef::query()->updateOrCreate(['key' => $def['key']], $def + ['is_active' => true, 'payload' => []]);
        }
    }
}
