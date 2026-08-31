<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class ImportProductionData extends Command
{
    protected $signature = 'data:import-production
                            {--path= : Input JSON file path}
                            {--truncate : Truncate existing application data first}';

    protected $description = 'Import application data exported for production migration';

    /**
     * Tables ordered according to their foreign-key dependencies.
     */
    protected array $tables = [
        // Identity / permissions
        'users',
        'roles',
        'permissions',
        'model_has_roles',
        'model_has_permissions',
        'role_has_permissions',

        // Taxonomy / courses
        'categories',
        'courses',
        'category_course',
        'sections',
        'lessons',

        // Quizzes
        'quizzes',
        'quiz_questions',
        'quiz_question_options',
        'quiz_attempts',
        'quiz_attempt_answers',
        'quiz_attempt_answer_options',

        // Assessments
        'assessments',
        'assessment_questions',
        'assessment_quizzes',
        'assessment_diagnostic_scenarios',
        'assessment_attempts',
        'assessment_attempt_answers',
        'assessment_attempt_answer_options',
        'assessment_results',

        // Content / learning
        'media',
        'enrollments',
        'lesson_progress',
        'section_progress',
        'course_progress',
        'certificates',

        // Diagnostic scenarios
        'diagnostic_scenarios',
        'diagnostic_scenario_steps',
        'diagnostic_scenario_scoring_criteria',
        'diagnostic_scenario_attempts',

        // Student settings
        'student_settings',
        'student_notification_settings',
        'student_privacy_settings',
        'student_learning_preferences',
        'student_security_settings',
        'student_assessment_preferences',
        'student_progression_profiles',
        'student_xp_transactions',
        'user_achievements',

        // Notifications / messaging
        'admin_broadcasts',
        'student_notifications',
        'message_conversations',
        'message_participants',
        'messages',

        // AI Mentor
        'mentor_ai_usages',
        'mentor_conversations',
        'mentor_memories',
        'mentor_message_feedback',
        'mentor_messages',

        // Authentication / sessions
        'personal_access_tokens',
        'user_sessions',
        'sessions',
    ];

    public function handle(): int
    {
        $path = $this->option('path')
            ?: storage_path('app/production-data.json');

        if (! file_exists($path)) {
            $this->error("Import file not found: {$path}");

            return self::FAILURE;
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            $this->error("Unable to read: {$path}");

            return self::FAILURE;
        }

        $data = json_decode($contents, true);

        if (! is_array($data) || ! isset($data['tables'])) {
            $this->error('Invalid production data JSON.');

            return self::FAILURE;
        }

        $tables = $data['tables'];

        $this->info('HBTronics production data import');
        $this->line('File: ' . $path);
        $this->line('Tables: ' . count($tables));

        if ($this->option('truncate')) {
            $this->warn('TRUNCATE mode requested.');

            if (! $this->confirm(
                'This will DELETE existing application data. Continue?',
                false
            )) {
                $this->warn('Import cancelled.');

                return self::SUCCESS;
            }
        }

        $this->newLine();

        Schema::disableForeignKeyConstraints();

        try {
            DB::transaction(function () use ($tables) {
                if ($this->option('truncate')) {
                    $this->truncateTables($tables);
                }

                foreach ($this->tables as $table) {
                    if (! isset($tables[$table])) {
                        continue;
                    }

                    if (! Schema::hasTable($table)) {
                        $this->warn("Skipping missing production table: {$table}");

                        continue;
                    }

                    $rows = $tables[$table];

                    if (! is_array($rows) || count($rows) === 0) {
                        $this->line("{$table}: 0 rows");

                        continue;
                    }

                    $this->importTable($table, $rows);
                }
            });
        } catch (\Throwable $e) {
            $this->error('Import failed.');
            $this->error($e->getMessage());

            report($e);

            return self::FAILURE;
        } finally {
            Schema::enableForeignKeyConstraints();
        }

        $this->newLine();
        $this->info('Production data import completed successfully.');

        return self::SUCCESS;
    }

    protected function truncateTables(array $tables): void
    {
        $this->warn('Clearing existing data...');

        foreach (array_reverse($this->tables) as $table) {
            if (! isset($tables[$table])) {
                continue;
            }

            if (! Schema::hasTable($table)) {
                continue;
            }

            DB::table($table)->truncate();

            $this->line("  Cleared {$table}");
        }
    }

    protected function importTable(string $table, array $rows): void
    {
        $this->info("Importing {$table}...");

        $chunks = array_chunk($rows, 500);

        foreach ($chunks as $chunk) {
            DB::table($table)->insert($chunk);
        }

        $this->line('  ' . count($rows) . ' rows');
    }
}