<?php

use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\DTOs\MentorPrompt;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Models\LessonProgress;
use App\Models\User;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\Lesson;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Domains\AI\Services\MentorContextService;
use App\Domains\AI\Services\MentorPromptService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\AI\DTOs\MentorStudentProfile;
use App\Domains\AI\Enums\MentorLearningLevel;
use App\Domains\AI\Services\MentorAdaptationService;
use App\Domains\AI\Services\MentorStudentProfileService;



uses(RefreshDatabase::class);

function mentorPromptForTest(): MentorPromptService
{
    return app(MentorPromptService::class);
}

function mentorPromptTestContext(): MentorContext
{
    return new MentorContext(
        userId: 'user-123',
        courseId: 'course-123',
        lessonId: 'lesson-123',

        course: [
            'id' => 'course-123',
            'title' => 'Engine Management Diagnostics',
        ],

        progress: [
            'percentage' => 68,
        ],

        assessments: [],

        quizzes: [],

        diagnosticScenarios: [],

        memories: [],

        lessonContext: null,
    );
}

it('builds a mentor prompt', function () {
    $conversation = MentorConversation::factory()->create();

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'What is a lean condition?',
    );

    expect($prompt)
        ->toBeInstanceOf(MentorPrompt::class);

    expect($prompt->messages)
        ->not->toBeEmpty();

    expect($prompt->estimatedTokens)
        ->toBeGreaterThan(0);
});

it('builds a system message', function () {
    $conversation = MentorConversation::factory()->create();

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'Help me diagnose this engine.',
    );

    expect($prompt->messages[0]['role'])
        ->toBe('system');

    expect($prompt->messages[0]['content'])
        ->toContain('HBTronics AI Mentor');
});

it('includes the current mentor context', function () {
    $conversation = MentorConversation::factory()->create();

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'Help me with this lesson.',
    );

    $systemMessage = $prompt->messages[0]['content'];

    expect($systemMessage)
        ->toContain('Engine Management Diagnostics')
        ->toContain('course-123')
        ->toContain('lesson-123')
        ->toContain('68');
});

it('includes previous conversation messages', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'What is fuel trim?',
    ]);

    MentorMessage::factory()->assistant()->create([
        'mentor_conversation_id' => $conversation->id,
        'content' => 'Fuel trim represents ECU corrections to fueling.',
    ]);

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'Why does it change?',
    );

    expect($prompt->messages)->toContain([
        'role' => 'user',
        'content' => 'What is fuel trim?',
    ]);

    expect($prompt->messages)->toContain([
        'role' => 'assistant',
        'content' => 'Fuel trim represents ECU corrections to fueling.',
    ]);
});

it('adds the current user message last', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'What is fuel trim?',
    ]);

    MentorMessage::factory()->assistant()->create([
        'mentor_conversation_id' => $conversation->id,
        'content' => 'Fuel trim represents ECU corrections to fueling.',
    ]);

    $prompt = mentorPromptForTest()->build(
    $conversation,
    mentorPromptTestContext(),
    'Why does it change?',
);

$lastMessage = $prompt->messages[array_key_last($prompt->messages)];

expect($lastMessage)
    ->toBe([
        'role' => 'user',
        'content' => 'Why does it change?',
    ]);
});

it('keeps the system message first', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Previous question.',
    ]);

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'Current question.',
    );

    expect($prompt->messages[0]['role'])
        ->toBe('system');
});

it('includes memories in the prompt when memories are available', function () {
    $conversation = MentorConversation::factory()->create();

    $context = mentorPromptTestContext();

    $context = new MentorContext(
        userId: $context->userId,
        courseId: $context->courseId,
        lessonId: $context->lessonId,

        course: $context->course,

        progress: $context->progress,

        assessments: $context->assessments,

        quizzes: $context->quizzes,

        diagnosticScenarios: $context->diagnosticScenarios,

        memories: [
            [
                'type' => 'weakness',
                'key' => 'fuel_trim',
                'value' => 'Student needs additional practice with fuel trim interpretation.',
                'confidence' => 0.95,
            ],
        ],
    );

    $prompt = mentorPromptForTest()->build(
        $conversation,
        $context,
        'Help me diagnose this issue.',
    );

    $systemMessage = $prompt->messages[0]['content'];

    expect($systemMessage)
        ->toContain('fuel_trim')
        ->toContain('Student needs additional practice with fuel trim interpretation.');
});

it('does not place the current user message before conversation history', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Previous question.',
    ]);

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'Current question.',
    );

    $messages = $prompt->messages;

    $currentUserIndex = collect($messages)
        ->search(
            fn ($message) =>
                ($message['role'] ?? null) === 'user'
                && ($message['content'] ?? null) === 'Current question.'
        );

    $previousUserIndex = collect($messages)
        ->search(
            fn ($message) =>
                ($message['role'] ?? null) === 'user'
                && ($message['content'] ?? null) === 'Previous question.'
        );

    expect($currentUserIndex)
        ->toBeGreaterThan($previousUserIndex);
});

it('keeps the prompt within the configured token budget', function () {
    $conversation = MentorConversation::factory()->create();

    foreach (range(1, 20) as $index) {
        MentorMessage::factory()->create([
            'mentor_conversation_id' => $conversation->id,
            'role' => $index % 2 === 0
                ? 'assistant'
                : 'user',
            'content' => str_repeat(
                "Long diagnostic conversation message {$index}. ",
                100
            ),
        ]);
    }

    $prompt = mentorPromptForTest()->build(
        $conversation,
        mentorPromptTestContext(),
        'What should I test next?',
    );

    expect($prompt->estimatedTokens)
        ->toBeLessThanOrEqual(6000);
});
it('includes the student profile in the mentor prompt', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = app(MentorContextService::class)
        ->build($user);

    $prompt = app(MentorPromptService::class)
        ->build(
            $conversation,
            $context,
            'How am I doing?'
        );

    $messages = $prompt->messages;

    expect($messages[0]['content'])
        ->toContain('student_profile')
        ->toContain('learning_level')
        ->toContain('overall_progress')
        ->toContain('quiz_performance')
        ->toContain('diagnostic_performance');
});
it('includes the actual learner profile values in the prompt', function () {
    $user = User::factory()->create();

    $profile = app(\App\Domains\AI\Services\MentorStudentProfileService::class)
        ->build($user);

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = app(MentorContextService::class)
        ->build($user);

    $prompt = app(MentorPromptService::class)
        ->build(
            $conversation,
            $context,
            'How am I doing?'
        );

    expect($prompt->messages[0]['content'])
        ->toContain(
            '"learning_level": "' .
            $profile->learningLevel->value .
            '"'
        )
        ->toContain(
            '"overall_progress": ' .
            $profile->overallProgress
        );
});

it('includes student adaptation in the prompt', function () {
    $service = app(MentorPromptService::class);

    $user = User::factory()->create();

    $profile = app(MentorStudentProfileService::class)
        ->build($user);

    $adaptation = app(MentorAdaptationService::class)
        ->build($profile);

    $context = app(MentorContextService::class)
        ->build($user);

    $context = new MentorContext(
        userId: $context->userId,
        courseId: $context->courseId,
        lessonId: $context->lessonId,
        course: $context->course,
        progress: $context->progress,
        assessments: $context->assessments,
        quizzes: $context->quizzes,
        diagnosticScenarios: $context->diagnosticScenarios,
        memories: $context->memories,
        studentProfile: $profile,
        adaptation: $adaptation,
    );

    $conversation = MentorConversation::factory()
        ->for($user)
        ->create();

    $messages = $service->buildMessages(
        $conversation,
        $context,
        'Explain this lesson to me.'
    );

    $systemMessage = $messages[0]['content'];

    expect($systemMessage)
        ->toContain('learning_level')
        ->toContain('explanation_depth')
        ->toContain('teaching_strategy')
        ->toContain('difficulty');
});

it('includes remediation behavior in the prompt', function () {
    $service = app(MentorPromptService::class);

    $profile = new MentorStudentProfile(
        userId: 'user-1',
        courseId: 'course-1',
        level: MentorLearningLevel::BEGINNER,

        coursesEnrolled: 1,
        coursesCompleted: 0,

        averageQuizScore: 45,
        averageAssessmentScore: 50,
        averageDiagnosticScore: 0,

        lessonsCompleted: 1,
        lessonsInProgress: 1,

        overallProgress: 25,
        courseProgress: 25,
        lessonProgress: 20,

        quizPerformance: 45,
        assessmentPerformance: 50,
        diagnosticPerformance: 0,

        coursesStarted: 1,

        weakAreas: [],
        strongAreas: [],
        recentFailures: [],
        recentSuccesses: [],
    );

    $adaptation = app(MentorAdaptationService::class)
        ->build($profile);

    expect($adaptation->prioritizeRemediation)
        ->toBeTrue();

    expect($adaptation->teachingStrategy)
        ->toBe('remedial');

    expect($adaptation->difficulty)
        ->toBe('remedial');

    $context = new MentorContext(
        userId: 'user-1',
        courseId: 'course-1',
        lessonId: 'lesson-1',
        course: [],
        progress: [],
        assessments: [],
        quizzes: [],
        diagnosticScenarios: [],
        memories: [],
        studentProfile: $profile,
        adaptation: $adaptation,
    );

    $conversation = MentorConversation::factory()->create();

    $messages = $service->buildMessages(
        $conversation,
        $context,
        'I do not understand this concept.'
    );

    $systemMessage = $messages[0]['content'];

    expect($systemMessage)
        ->toContain('remedial')
        ->toContain('prioritize_remediation');
});

it('adaptation is separate from student profile', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    $this->assertNotSame(
        $context->studentProfile,
        $context->adaptation
    );

    $this->assertIsArray(
        $context->studentProfile->toArray()
    );

    $this->assertIsArray(
        $context->adaptation->toArray()
    );
});
it('includes lesson context in the mentor prompt', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $context = app(MentorContextService::class)
        ->build(
            $user,
            $course->id,
            $lesson->id,
        );

    $conversation = MentorConversation::factory()
        ->for($user)
        ->create();

    $prompt = app(MentorPromptService::class)
        ->build(
            $conversation,
            $context,
            'Explain this lesson to me.',
        );

    $systemMessage = $prompt->messages[0]['content'];

    expect($systemMessage)
        ->toContain((string) $lesson->id);
});
it('includes retrieved course knowledge in the mentor prompt', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
        'title' => 'MAF Sensor Diagnostics',
        'content' => 'The MAF sensor measures incoming air mass.',
    ]);

    $context = app(MentorContextService::class)->build(
        user: $user,
        courseId: $course->id,
        query: 'What does MAF measure?',
    );

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $prompt = app(MentorPromptService::class)->build(
        $conversation,
        $context,
        'What does MAF measure?',
    );

    expect($prompt->toArray()[0]['content'])
        ->toContain('RETRIEVED COURSE KNOWLEDGE')
        ->toContain('MAF Sensor Diagnostics')
        ->toContain('incoming air mass');
});
it('does not retrieve content from another course', function () {
    $user = User::factory()->create();

    $courseA = Course::factory()->create();
    $courseB = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $courseA->id,
    ]);

    $sectionA = Section::factory()->create([
        'course_id' => $courseA->id,
    ]);

    $sectionB = Section::factory()->create([
        'course_id' => $courseB->id,
    ]);

    Lesson::factory()->create([
        'section_id' => $sectionA->id,
        'status' => LessonStatus::PUBLISHED,
        'title' => 'Engine Diagnostics',
        'content' => 'Engine diagnostic information.',
    ]);

    Lesson::factory()->create([
        'section_id' => $sectionB->id,
        'status' => LessonStatus::PUBLISHED,
        'title' => 'Engine Diagnostics',
        'content' => 'Secret unrelated course information.',
    ]);

    $context = app(MentorContextService::class)->build(
        user: $user,
        courseId: $courseA->id,
        query: 'Engine Diagnostics',
    );

    foreach ($context->retrievedChunks as $chunk) {
        expect($chunk->metadata['course_id'])
            ->toBe($courseA->id);
    }
});