<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExportProductionData extends Command
{
    protected $signature = 'data:export-production
                            {--path= : Output JSON file path}';

    protected $description = 'Export application data for production migration';

    public function handle(): int
    {
        $path = $this->option('path')
            ?: storage_path('app/production-data.json');

        $this->info('Exporting HBTronics database data...');

        $tables = [
            'users',
            'roles',
            'permissions',
            'model_has_roles',
            'model_has_permissions',
            'role_has_permissions',

            'categories',
            'courses',
            'category_course',

            'sections',
            'lessons',

            'quizzes',
            'quiz_questions',
            'quiz_question_options',
            'quiz_attempts',
            'quiz_attempt_answers',
            'quiz_attempt_answer_options',

            'assessments',
            'assessment_questions',
            'assessment_quizzes',
            'assessment_diagnostic_scenarios',
            'assessment_attempts',
            'assessment_attempt_answers',
            'assessment_attempt_answer_options',
            'assessment_results',

            'media',
            'enrollments',
            'lesson_progress',
            'section_progress',
            'course_progress',

            'certificates',

            'diagnostic_scenarios',
            'diagnostic_scenario_steps',
            'diagnostic_scenario_scoring_criteria',
            'diagnostic_scenario_attempts',

            'student_settings',
            'student_notification_settings',
            'student_privacy_settings',
            'student_learning_preferences',
            'student_security_settings',
            'student_assessment_preferences',
            'student_progression_profiles',
            'student_xp_transactions',
            'user_achievements',

            'admin_broadcasts',
            'student_notifications',

            'message_conversations',
            'message_participants',
            'messages',

            'mentor_ai_usages',
            'mentor_conversations',
            'mentor_memories',
            'mentor_message_feedback',
            'mentor_messages',

            'personal_access_tokens',
            'user_sessions',
            'sessions',
        ];

        $export = [
            'meta' => [
                'exported_at' => now()->toISOString(),
                'app' => config('app.name'),
                'environment' => app()->environment(),
            ],
            'tables' => [],
        ];

        foreach ($tables as $table) {
            if (! DB::getSchemaBuilder()->hasTable($table)) {
                $this->warn("Skipping missing table: {$table}");
                continue;
            }

            $this->info("Exporting {$table}...");

            $rows = DB::table($table)->get();

            $export['tables'][$table] = $rows
                ->map(fn ($row) => (array) $row)
                ->values()
                ->all();

            $this->line('  ' . count($export['tables'][$table]) . ' rows');
        }

        file_put_contents(
            $path,
            json_encode(
                $export,
                JSON_PRETTY_PRINT |
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            )
        );

        $size = filesize($path);

        $this->newLine();
        $this->info('Export completed successfully.');
        $this->info("File: {$path}");
        $this->info('Size: ' . number_format($size / 1024, 2) . ' KB');

        return self::SUCCESS;
    }
}