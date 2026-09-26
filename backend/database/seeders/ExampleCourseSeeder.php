<?php

namespace Database\Seeders;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\Competency;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticActionType;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Complete example course: "API Security Fundamentals".
 *
 * Exercises the full Assessment → Learning → Reassessment loop:
 * course → sections → lessons → quizzes (all 8 question types, IRT
 * calibrated) → competencies (+ lesson/question mappings) →
 * diagnostic scenario (steps + criteria) → formative (lesson-scoped),
 * section and final (adaptive) assessments.
 *
 * Idempotent: re-running changes nothing (slug-guarded).
 *
 * Demo accounts (password: "password"):
 * - maya.instructor@example.com (Instructor)
 * - sam.student@example.com (Student, enrolled, lessons completed)
 */
final class ExampleCourseSeeder extends Seeder
{
    private const COURSE_SLUG = 'api-security-fundamentals';

    public function run(): void
    {
        if (Course::where('slug', self::COURSE_SLUG)->exists()) {
            $this->command?->info('Example course already seeded, skipping.');

            return;
        }

        Role::findOrCreate('Instructor', 'web');
        Role::findOrCreate('Student', 'web');

        $instructor = $this->user('maya.instructor@example.com', 'Maya', 'Instructor', 'Instructor');
        $student = $this->user('sam.student@example.com', 'Sam', 'Student', 'Student');

        $course = $this->course($instructor);
        $sections = $this->sections($course);
        $lessons = $this->lessons($sections);
        $competencies = $this->competencies($lessons);
        $quizzes = $this->quizzes($sections);
        $scenario = $this->scenario($course);
        $this->assessments($course, $sections, $lessons, $quizzes, $competencies, $scenario);
        $this->demoProgress($student, $course, $lessons);

        $this->command?->info('Seeded example course "API Security Fundamentals".');
        $this->command?->info('Demo path: enroll (already enrolled) → pass section quizzes (70+) → complete the scenario → pass the section assessment → unlock the adaptive final.');
    }

    private function user(string $email, string $first, string $last, string $role): User
    {
        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'first_name' => $first,
                'last_name' => $last,
                'username' => strtolower($first).'.'.strtolower($last),
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );
        $user->assignRole($role);

        return $user;
    }

    private function course(User $instructor): Course
    {
        return Course::create([
            'instructor_id' => $instructor->id,
            'title' => 'API Security Fundamentals',
            'slug' => self::COURSE_SLUG,
            'short_description' => 'Authenticate users, authorize requests, and respond to incidents.',
            'description' => 'A hands-on introduction to securing Laravel APIs: authentication, object-level authorization, and incident response, assessed end to end.',
            'language' => 'en',
            'difficulty' => 'beginner',
            'duration_minutes' => 180,
            'price' => 0,
            'discount_price' => null,
            'currency' => 'USD',
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
            'published_at' => now(),
        ]);
    }

    /**
     * @return array{auth: Section, authz: Section, incident: Section}
     */
    private function sections(Course $course): array
    {
        $make = fn (string $title, string $slug, int $position) => Section::create([
            'course_id' => $course->id,
            'title' => $title,
            'slug' => $slug,
            'description' => null,
            'position' => $position,
            'status' => SectionStatus::PUBLISHED,
        ]);

        return [
            'auth' => $make('Authentication Basics', 'authentication-basics', 1),
            'authz' => $make('API Authorization', 'api-authorization', 2),
            'incident' => $make('Incident Response', 'incident-response', 3),
        ];
    }

    private function lessons(array $sections): array
    {
        $make = fn (Section $section, string $title, string $slug, int $position) => Lesson::create([
            'section_id' => $section->id,
            'title' => $title,
            'slug' => $slug,
            'description' => null,
            'content' => $title.' — example lesson content.',
            'position' => $position,
            'status' => LessonStatus::PUBLISHED,
        ]);

        return [
            'passwords' => $make($sections['auth'], 'Passwords & MFA', 'passwords-mfa', 1),
            'tokens' => $make($sections['auth'], 'Token-based authentication', 'token-auth', 2),
            'bola' => $make($sections['authz'], 'Object-level authorization', 'object-level-authorization', 1),
            'scopes' => $make($sections['authz'], 'OAuth scopes', 'oauth-scopes', 2),
            'detect' => $make($sections['incident'], 'Detecting suspicious activity', 'detecting-suspicious-activity', 1),
        ];
    }

    private function competencies(array $lessons): array
    {
        $make = fn (string $code, string $name, string $category) => Competency::firstOrCreate(
            ['code' => $code],
            [
                'name' => $name,
                'description' => "Example competency: {$name}.",
                'category' => $category,
            ],
        );

        $competencies = [
            'authn' => $make('AUTHN', 'Authentication', 'Technical'),
            'authz' => $make('AUTHZ', 'Authorization', 'Technical'),
            'incident' => $make('INCIDENT', 'Incident Response', 'Technical'),
        ];

        $link = function (Competency $competency, Lesson $lesson, int $relevance) {
            if (! DB::table('competency_lesson')->where('competency_id', $competency->id)->where('lesson_id', $lesson->id)->exists()) {
                DB::table('competency_lesson')->insert([
                    'competency_id' => $competency->id,
                    'lesson_id' => $lesson->id,
                    'relevance_score' => $relevance,
                    'coverage_type' => 'primary',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        };

        $link($competencies['authn'], $lessons['passwords'], 100);
        $link($competencies['authn'], $lessons['tokens'], 90);
        $link($competencies['authz'], $lessons['bola'], 100);
        $link($competencies['authz'], $lessons['scopes'], 90);
        $link($competencies['incident'], $lessons['detect'], 100);

        return $competencies;
    }

    private function quizzes(array $sections): array
    {
        $quiz = fn (Section $section, string $title, string $slug) => Quiz::create([
            'section_id' => $section->id,
            'title' => $title,
            'slug' => $slug,
            'description' => null,
            'position' => 1,
            'status' => QuizStatus::PUBLISHED,
            'pass_percentage' => 70,
            'max_attempts' => null,
            'time_limit' => null,
        ]);

        $quizzes = [
            'auth' => $quiz($sections['auth'], 'Authentication knowledge check', 'auth-knowledge-check'),
            'authz' => $quiz($sections['authz'], 'Authorization knowledge check', 'authz-knowledge-check'),
            'incident' => $quiz($sections['incident'], 'Incident response check', 'incident-response-check'),
        ];

        // --- Section 1: single choice, true/false, short answer, numeric ---
        $q1 = $this->question($quizzes['auth'], 'Which factor is "something you have"?', QuizQuestionType::SINGLE_CHOICE, 1, irtB: -1.0);
        $this->options($q1, [['Hardware security key', true], ['A memorized password', false], ['A fingerprint', false], ['A PIN code', false]]);
        $q2 = $this->question($quizzes['auth'], 'A bearer token must be sent in the Authorization header.', QuizQuestionType::TRUE_FALSE, 2, irtB: 0.0);
        $this->options($q2, [['True', true], ['False', false]]);
        $q3 = $this->question($quizzes['auth'], 'Which HTTP header carries a bearer token?', QuizQuestionType::SHORT_ANSWER, 3, answerKey: ['accepted' => ['Authorization', 'Authorization header'], 'case_sensitive' => false]);
        $q4 = $this->question($quizzes['auth'], 'What HTTP status code means "Unauthorized"?', QuizQuestionType::NUMERIC, 4, answerKey: ['value' => 401, 'tolerance' => 0], irtB: 0.5);

        // --- Section 2: multiple choice, ordering, matching ---
        $q5 = $this->question($quizzes['authz'], 'Which are signs of broken object-level authorization? (select two)', QuizQuestionType::MULTIPLE_CHOICE, 1, irtB: 0.0);
        $this->options($q5, [
            ["Changing /invoices/123 to /invoices/124 shows another customer's data", true],
            ['API responses include other users\u2019 email addresses', true],
            ['The server returns 401 without a token', false],
            ['The admin panel requires an admin role', false],
        ]);
        $q6 = $this->question($quizzes['authz'], 'Order the OAuth authorization-code flow.', QuizQuestionType::ORDERING, 2);
        $orderOpts = $this->options($q6, [
            ['Client redirects the user to authorize', false],
            ['User approves the client', false],
            ['Client exchanges the code for a token', false],
            ['Client calls the API with the token', false],
        ]);
        $q6->update(['answer_key' => ['ordered_option_ids' => $orderOpts->pluck('id')->all()]]);
        $q7 = $this->question($quizzes['authz'], 'Match each status code to its meaning.', QuizQuestionType::MATCHING, 3, answerKey: ['pairs' => ['401' => 'Unauthorized', '403' => 'Forbidden', '404' => 'Not Found']]);

        // --- Section 3: scenario-flavoured choice + long answer with rubric ---
        $q8 = $this->question($quizzes['incident'], 'Logs show a 40x spike on /admin/export from one token. What is the first action?', QuizQuestionType::SINGLE_CHOICE, 1, irtB: 1.0);
        $this->options($q8, [['Revoke the token and investigate', true], ['Delete the logs', false], ['Restart the server', false], ['Email all users', false]]);
        $this->question($quizzes['incident'], 'A partner reports their API key in a public repository. Describe your first three response steps.', QuizQuestionType::LONG_ANSWER, 2, answerKey: [
            'rubric' => [
                ['key' => 'containment', 'description' => 'Revokes or rotates the exposed key immediately.', 'points' => 5],
                ['key' => 'assessment', 'description' => 'Reviews logs for misuse of the key.', 'points' => 5],
            ],
        ]);

        return $quizzes;
    }

    private function question(Quiz $quiz, string $text, QuizQuestionType $type, int $position, ?array $answerKey = null, ?float $irtB = null): QuizQuestion
    {
        return QuizQuestion::create([
            'quiz_id' => $quiz->id,
            'question' => $text,
            'type' => $type,
            'position' => $position,
            'points' => 1,
            'required' => true,
            'answer_key' => $answerKey,
            'scoring_config' => null,
            'irt_a' => $irtB === null ? null : 1.0,
            'irt_b' => $irtB,
            'irt_c' => $irtB === null ? null : 0.2,
            'is_calibrated' => $irtB !== null,
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, QuizQuestionOption>
     */
    private function options(QuizQuestion $question, array $options)
    {
        $created = collect();
        foreach (array_values($options) as $position => [$text, $correct]) {
            $created->push(QuizQuestionOption::create([
                'quiz_question_id' => $question->id,
                'option' => $text,
                'is_correct' => $correct,
                'position' => $position + 1,
            ]));
        }

        return $created;
    }

    private function scenario(Course $course): DiagnosticScenario
    {
        $scenario = DiagnosticScenario::create([
            'course_id' => $course->id,
            'title' => 'Suspicious API activity',
            'slug' => 'suspicious-api-activity',
            'description' => 'Work the steps: inspect the logs, identify the attack, and contain it.',
            'position' => 1,
            'passing_score' => 70,
            'time_limit' => 30,
            'status' => DiagnosticScenarioStatus::PUBLISHED,
            'is_required' => true,
            'published_at' => now(),
        ]);

        $step1 = DiagnosticScenarioStep::create([
            'diagnostic_scenario_id' => $scenario->id,
            'position' => 1,
            'title' => 'Review the access logs',
            'description' => 'Decide what to inspect first.',
            'action_type' => DiagnosticActionType::INSPECT,
            'configuration' => ['correct_action' => 'inspect', 'correct_component' => 'api_logs'],
            'evidence' => ['log_excerpt' => '401/403 spike on /admin/export from a single token'],
            'is_required' => true,
            'is_terminal' => false,
        ]);

        $step2 = DiagnosticScenarioStep::create([
            'diagnostic_scenario_id' => $scenario->id,
            'position' => 2,
            'title' => 'Identify the attack',
            'description' => 'Name the vulnerability class behind the spike.',
            'action_type' => DiagnosticActionType::IDENTIFY,
            'configuration' => [],
            'evidence' => [],
            'is_required' => true,
            'is_terminal' => false,
        ]);

        DiagnosticScenarioScoringCriterion::create([
            'diagnostic_scenario_id' => $scenario->id,
            'step_id' => $step2->id,
            'key' => 'attack-class',
            'title' => 'Identifies broken object-level authorization',
            'description' => null,
            'points' => 20,
            'evaluation_type' => 'contains',
            'rules' => ['field' => 'finding', 'expected' => 'authorization'],
            'is_required' => true,
            'position' => 1,
        ]);

        DiagnosticScenarioStep::create([
            'diagnostic_scenario_id' => $scenario->id,
            'position' => 3,
            'title' => 'Contain the incident',
            'description' => 'Choose the containment action.',
            'action_type' => DiagnosticActionType::REPAIR,
            'configuration' => ['correct_action' => 'repair', 'correct_component' => 'api_token'],
            'evidence' => [],
            'is_required' => true,
            'is_terminal' => true,
        ]);

        return $scenario;
    }

    private function assessments(Course $course, array $sections, array $lessons, array $quizzes, array $competencies, DiagnosticScenario $scenario): void
    {
        // 1. Formative, scoped to the first lesson.
        $formative = Assessment::create([
            'course_id' => $course->id,
            'lesson_id' => $lessons['passwords']->id,
            'title' => 'Passwords & MFA check',
            'slug' => 'passwords-mfa-check',
            'description' => 'Are you understanding this lesson?',
            'minimum_score' => 60,
            'required_quiz_score' => 0,
            'required_scenarios' => 0,
            'max_attempts' => null,
            'is_required' => false,
            'status' => 'published',
            'assessment_mode' => 'formative',
            'interaction_types' => ['knowledge'],
            'published_at' => now(),
        ]);
        $this->attachQuestions($formative, [
            [$this->questionByPosition($quizzes['auth'], 1), 10, $competencies['authn']],
            [$this->questionByPosition($quizzes['auth'], 2), 10, $competencies['authn']],
        ]);

        // 2. Required section assessment for section 1.
        $sectionAssessment = Assessment::create([
            'course_id' => $course->id,
            'section_id' => $sections['auth']->id,
            'title' => 'Authentication section assessment',
            'slug' => 'authentication-section-assessment',
            'description' => 'Have you mastered authentication basics?',
            'minimum_score' => 70,
            'required_quiz_score' => 0,
            'required_scenarios' => 0,
            'max_attempts' => 3,
            'is_required' => true,
            'status' => 'published',
            'assessment_mode' => 'summative',
            'interaction_types' => ['knowledge'],
            'published_at' => now(),
        ]);
        $position = 0;
        foreach ($quizzes['auth']->questions()->orderBy('position')->get() as $question) {
            $position++;
            $this->attachQuestion($sectionAssessment, $question->id, $position, 10, $competencies['authn']);
        }
        $sectionAssessment->competencies()->attach($competencies['authn']->id, ['position' => 1, 'weight' => 1.0]);

        // 3. Adaptive final: full loop (quizzes + scenario + section gate).
        $final = Assessment::create([
            'course_id' => $course->id,
            'title' => 'API Security final assessment',
            'slug' => 'api-security-final-assessment',
            'description' => 'Have you achieved the required competency? Adaptive: questions adjust to your ability.',
            'minimum_score' => 80,
            'required_quiz_score' => 70,
            'required_scenarios' => 1,
            'max_attempts' => 2,
            'is_required' => true,
            'status' => 'published',
            'assessment_mode' => 'final',
            'interaction_types' => ['knowledge', 'adaptive'],
            'adaptive_config' => ['min_questions' => 3, 'max_questions' => 8, 'target_se' => 0.3],
            'published_at' => now(),
        ]);
        $final->quizzes()->attach($quizzes['auth']->id, ['position' => 1, 'is_required' => true]);
        $final->quizzes()->attach($quizzes['authz']->id, ['position' => 2, 'is_required' => true]);
        $final->quizzes()->attach($quizzes['incident']->id, ['position' => 3, 'is_required' => true]);
        $final->diagnosticScenarios()->attach($scenario->id, ['position' => 1, 'is_required' => true]);

        $finalQuestions = [
            [$this->questionByPosition($quizzes['auth'], 1), 10, $competencies['authn']],
            [$this->questionByPosition($quizzes['auth'], 2), 10, $competencies['authn']],
            [$this->questionByPosition($quizzes['authz'], 1), 20, $competencies['authz']],
            [$this->questionByPosition($quizzes['authz'], 2), 20, $competencies['authz']],
            [$this->questionByPosition($quizzes['incident'], 1), 20, $competencies['incident']],
            [$this->questionByPosition($quizzes['incident'], 2), 20, $competencies['incident']],
        ];
        $this->attachQuestions($final, $finalQuestions);

        $final->competencies()->attach($competencies['authn']->id, ['position' => 1, 'weight' => 1.0]);
        $final->competencies()->attach($competencies['authz']->id, ['position' => 2, 'weight' => 1.5]);
        $final->competencies()->attach($competencies['incident']->id, ['position' => 3, 'weight' => 1.0]);
    }

    private function questionByPosition(Quiz $quiz, int $position): QuizQuestion
    {
        return $quiz->questions()->where('position', $position)->firstOrFail();
    }

    private function attachQuestions(Assessment $assessment, array $rows): void
    {
        foreach (array_values($rows) as $index => [$question, $points, $competency]) {
            $this->attachQuestion($assessment, $question->id, $index + 1, $points, $competency);
        }
    }

    private function attachQuestion(Assessment $assessment, string $questionId, int $position, int $points, Competency $competency): void
    {
        DB::table('assessment_questions')->insert([
            'assessment_id' => $assessment->id,
            'quiz_question_id' => $questionId,
            'competency_id' => $competency->id,
            'position' => $position,
            'points' => $points,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function demoProgress(User $student, Course $course, array $lessons): void
    {
        Enrollment::firstOrCreate(
            ['user_id' => $student->id, 'course_id' => $course->id],
            ['status' => EnrollmentStatus::ACTIVE, 'enrolled_at' => now()],
        );

        foreach ($lessons as $lesson) {
            LessonProgress::updateOrCreate(
                ['user_id' => $student->id, 'lesson_id' => $lesson->id],
                ['progress_percentage' => 100, 'completed_at' => now()],
            );
        }
    }
}
