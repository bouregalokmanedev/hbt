<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\MediaController;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\Api\V1\EnrollmentController;
use App\Http\Controllers\Api\V1\CourseFeedbackController;
use App\Http\Controllers\Api\V1\CertificateController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\MediaStreamController;
use App\Http\Controllers\Api\CourseProgressController;
use App\Domains\AI\Http\Controllers\SendMentorMessageController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\QuizAttemptController;
use App\Http\Controllers\Api\V1\AssessmentAttemptController;
use App\Http\Controllers\Api\V1\AssessmentController;
use App\Domains\AI\Http\Controllers\StreamMentorMessageController;
use App\Domains\Students\Controllers\StudentSettingsController;
use App\Domains\AI\Http\Controllers\SubmitMentorMessageFeedbackController;
use App\Domains\AI\Http\Controllers\MentorConversationAnalyticsController;
use App\Domains\Students\Controllers\StudentAppearanceSettingsController;
use App\Domains\Students\Controllers\StudentNotificationSettingsController;
use App\Domains\Students\Controllers\StudentPrivacySettingsController;
use App\Domains\Students\Controllers\StudentLearningPreferenceController;
use App\Domains\Students\Controllers\StudentSecurityController;
use App\Domains\Students\Controllers\StudentAdvancedSettingsController;
use App\Domains\AI\Http\Controllers\MentorDiagnosticToolController;
use App\Domains\Notifications\Controllers\StudentNotificationController;
use App\Domains\Admin\Controllers\AdminDashboardController;
use App\Domains\Admin\Controllers\AdminCourseController;
use App\Domains\Admin\Controllers\AdminEnrollmentController;
use App\Domains\Admin\Controllers\AdminAnalyticsController;
use App\Domains\Admin\Controllers\AdminActivityController;
use App\Domains\Admin\Controllers\AdminSystemController;
use App\Domains\Admin\Controllers\AdminNotificationController;
use App\Domains\Instructor\Controllers\InstructorAnnouncementController;
use App\Domains\Messaging\Controllers\ConversationController as MessagingConversationController;
use App\Domains\Messaging\Controllers\MessageController as MessagingMessageController;




Route::prefix('v1')->group(function () {

    // Certificate verification is intentionally public so QR scans work without a login.
    Route::get('/certificates/verify/{certificateNumber}', [CertificateController::class, 'verify']);

    Route::prefix('auth')->group(function () {

        Route::get('/google/redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('/google/callback', [GoogleAuthController::class, 'callback']);
        Route::post('/google/exchange', [GoogleAuthController::class, 'exchange']);

     Route::post(
            '/register',
            [AuthController::class, 'register']
        );

Route::post(
    '/login',
    [AuthController::class, 'login']
);
Route::post('/two-factor/login/verify', [AuthController::class, 'verifyTwoFactorLogin']);
Route::post(
    '/forgot-password',
    [AuthController::class, 'forgotPassword']
);
Route::post(
    '/reset-password',
    [AuthController::class, 'resetPassword']
);

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('/logout', [AuthController::class, 'logout']);

            Route::get('/me', [AuthController::class, 'me']);

        });

        Route::middleware('auth:sanctum')->group(function () {
    Route::get(
        '/dashboard',
        DashboardController::class
    );
    Route::patch(
    '/profile',
    [AuthController::class, 'updateProfile']
);
Route::put('/profile', [
    AuthController::class,
    'updateProfile',
]);
});

    });

     Route::middleware([
            'auth:sanctum',
            'verified',
            'role:Admin|Super Admin',
        ])
        ->prefix('admin')
        ->group(function () {

            Route::get('/dashboard', [AdminDashboardController::class, 'show'])
                ->name('admin.dashboard');

            Route::apiResource('users', UserController::class);

            Route::patch('users/{user}/restore', [UserController::class, 'restore'])
                ->withTrashed();
            Route::patch('users/{user}/activate', [UserController::class, 'activate']);
            Route::patch('users/{user}/suspend', [UserController::class, 'suspend']);
            Route::patch('users/{user}/role', [UserController::class, 'assignRole']);
            Route::patch('users/{user}/password', [UserController::class, 'changePassword']);

            Route::get('courses', [AdminCourseController::class, 'index']);
            Route::get('courses/{course}', [AdminCourseController::class, 'show']);
            Route::patch('courses/{course}/approve', [AdminCourseController::class, 'approve']);
            Route::patch('courses/{course}/reject', [AdminCourseController::class, 'reject']);
            Route::patch('courses/{course}/publish', [AdminCourseController::class, 'publish']);
            Route::patch('courses/{course}/archive', [AdminCourseController::class, 'archive']);
            Route::patch('courses/{course}/restore', [AdminCourseController::class, 'restore']);

            Route::get('enrollments', [AdminEnrollmentController::class, 'index']);
            Route::get('enrollments/{enrollment}', [AdminEnrollmentController::class, 'show']);

            Route::prefix('analytics')->group(function () {
                Route::get('overview', [AdminAnalyticsController::class, 'overview']);
                Route::get('users', [AdminAnalyticsController::class, 'users']);
                Route::get('courses', [AdminAnalyticsController::class, 'courses']);
                Route::get('enrollments', [AdminAnalyticsController::class, 'enrollments']);
                Route::get('learning', [AdminAnalyticsController::class, 'learning']);
            });

            Route::get('activity', [AdminActivityController::class, 'index']);
            Route::get('activity/{activity}', [AdminActivityController::class, 'show']);

            Route::prefix('system')->group(function () {
                Route::get('health', [AdminSystemController::class, 'health']);
                Route::get('statistics', [AdminSystemController::class, 'statistics']);
                Route::get('audit-log', [AdminSystemController::class, 'auditLog']);
            });

            Route::get('notifications/broadcasts', [AdminNotificationController::class, 'index']);
            Route::post('notifications/broadcast', [AdminNotificationController::class, 'broadcast']);
            Route::get('notifications/broadcasts/{broadcast}', [AdminNotificationController::class, 'show']);
        });


});

Route::middleware([
    'auth:sanctum',
    'verified',
])->prefix('v1')->group(function () {

Route::get('/certificates', [CertificateController::class, 'index']);
    Route::get('/notifications', [StudentNotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [StudentNotificationController::class, 'readAll']);
    Route::patch('/notifications/{notification}/read', [StudentNotificationController::class, 'read']);

    Route::prefix('messages')->group(function () {
        Route::get('/conversations', [MessagingConversationController::class, 'index']);
        Route::get('/contacts', [MessagingConversationController::class, 'contacts']);
        Route::post('/conversations', [MessagingConversationController::class, 'store']);
        Route::get('/conversations/{conversation}', [MessagingConversationController::class, 'show']);
        Route::patch('/conversations/{conversation}/archive', [MessagingConversationController::class, 'archive']);
        Route::post('/conversations/{conversation}/messages', [MessagingMessageController::class, 'store']);
        Route::patch('/conversations/{conversation}/read', [MessagingMessageController::class, 'read']);
    });

    Route::get(
        '/enrollments',
        [EnrollmentController::class, 'index']
    )->name('enrollments.index');

    Route::post(
        '/enrollments',
        [EnrollmentController::class, 'store']
    )->name('enrollments.store');

    Route::get(
        '/enrollments/{enrollment}',
        [EnrollmentController::class, 'show']
    )->name('enrollments.show');

    Route::post(
        '/enrollments/{enrollment}/complete',
        [EnrollmentController::class, 'complete']
    )->name('enrollments.complete');

    Route::post(
        '/enrollments/{enrollment}/cancel',
        [EnrollmentController::class, 'cancel']
    )->name('enrollments.cancel');

    Route::get('/certificates', [CertificateController::class, 'index']);
Route::get('/certificates/{certificate}', [CertificateController::class, 'show']);
Route::get('/certificates/{certificate}/download', [CertificateController::class, 'download']);

Route::prefix('student')->group(function () {
    Route::get(
        '/settings',
        [StudentSettingsController::class, 'show'],
    );
    Route::patch(
    '/settings',
    [StudentSettingsController::class, 'update'],
);
 Route::patch(
            '/settings/appearance',
            [StudentAppearanceSettingsController::class, 'update'],
        );

        Route::patch(
            '/settings/notifications',
            [StudentNotificationSettingsController::class, 'update'],
        );
        Route::patch(
    '/settings/privacy',
    [StudentPrivacySettingsController::class, 'update']
);
Route::patch(
    '/settings/learning',
    [StudentLearningPreferenceController::class, 'update']
);
Route::patch(
    '/settings/security/password',
    [StudentSecurityController::class, 'changePassword'],
);
Route::get('/settings/security', [StudentAdvancedSettingsController::class, 'security']);
Route::get('/settings/security/login-activity', [StudentAdvancedSettingsController::class, 'loginActivity']);
Route::post('/settings/security/two-factor/enable', [StudentAdvancedSettingsController::class, 'enableTwoFactor']);
Route::post('/settings/security/two-factor/verify', [StudentAdvancedSettingsController::class, 'verifyTwoFactor']);
Route::delete('/settings/security/two-factor', [StudentAdvancedSettingsController::class, 'disableTwoFactor']);
Route::get('/settings/achievements', [StudentAdvancedSettingsController::class, 'achievements']);
Route::get('/settings/assessment', [StudentAdvancedSettingsController::class, 'assessment']);
Route::patch('/settings/assessment', [StudentAdvancedSettingsController::class, 'updateAssessment']);
Route::get('/settings/export', [StudentAdvancedSettingsController::class, 'export']);
Route::delete('/settings/account', [StudentAdvancedSettingsController::class, 'destroy']);
});
});


Route::middleware([
    'auth:sanctum',
    'verified',
    'role:Instructor',
])
    ->prefix('v1/instructor')
    ->group(function () {

        Route::get(
            '/dashboard',
            [
                \App\Http\Controllers\Api\V1\Instructor\DashboardController::class,
                'show',
            ]
        )->name('instructor.dashboard');

        Route::get(
            '/courses',
            [
                \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
                'index',
            ]
        )->name('instructor.courses.index');

        Route::post('/courses', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'store',
        ])->name('instructor.courses.store');

        Route::get('/courses/{course}', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'show',
        ])->name('instructor.courses.show');

        Route::match(['put', 'patch'], '/courses/{course}', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'update',
        ])->name('instructor.courses.update');

        Route::delete('/courses/{course}', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'destroy',
        ])->name('instructor.courses.destroy');

        Route::post('/courses/{course}/publish', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'publish',
        ])->name('instructor.courses.publish');

        Route::post('/courses/{course}/unpublish', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'unpublish',
        ])->name('instructor.courses.unpublish');

        Route::post('/courses/{course}/submit-review', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'submitForReview',
        ])->name('instructor.courses.submit-review');

        Route::post('/courses/{course}/archive', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'archive',
        ])->name('instructor.courses.archive');

        Route::post('/courses/{course}/restore', [
            \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
            'restore',
        ])->name('instructor.courses.restore');

        Route::get('/courses/{course}/curriculum', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'show',
        ])->name('instructor.courses.curriculum');

        Route::post('/courses/{course}/sections', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'storeSection',
        ])->name('instructor.sections.store');

        Route::patch('/sections/{section}', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'updateSection',
        ])->name('instructor.sections.update');

        Route::delete('/sections/{section}', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'destroySection',
        ])->name('instructor.sections.destroy');

        Route::post('/sections/{section}/publish', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'publishSection',
        ])->name('instructor.sections.publish');

        Route::post('/sections/{section}/unpublish', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'unpublishSection',
        ])->name('instructor.sections.unpublish');

        Route::post('/sections/{section}/reorder', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'reorderSection',
        ])->name('instructor.sections.reorder');

        Route::post('/sections/{section}/lessons', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'storeLesson',
        ])->name('instructor.lessons.store');

        Route::patch('/lessons/{lesson}', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'updateLesson',
        ])->name('instructor.lessons.update');

        Route::delete('/lessons/{lesson}', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'destroyLesson',
        ])->name('instructor.lessons.destroy');

        Route::post('/lessons/{lesson}/publish', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'publishLesson',
        ])->name('instructor.lessons.publish');

        Route::post('/lessons/{lesson}/unpublish', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'unpublishLesson',
        ])->name('instructor.lessons.unpublish');

        Route::post('/lessons/{lesson}/reorder', [
            \App\Http\Controllers\Api\V1\Instructor\CurriculumController::class,
            'reorderLesson',
        ])->name('instructor.lessons.reorder');

        Route::get('/courses/{course}/quizzes', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'index',
        ])->name('instructor.quizzes.index');

        Route::post('/courses/{course}/quizzes', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'store',
        ])->name('instructor.quizzes.store');

        Route::get('/quizzes/{quiz}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'show',
        ])->name('instructor.quizzes.show');

        Route::patch('/quizzes/{quiz}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'update',
        ])->name('instructor.quizzes.update');

        Route::delete('/quizzes/{quiz}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'destroy',
        ])->name('instructor.quizzes.destroy');

        Route::post('/quizzes/{quiz}/publish', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'publish',
        ])->name('instructor.quizzes.publish');

        Route::post('/quizzes/{quiz}/unpublish', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'unpublish',
        ])->name('instructor.quizzes.unpublish');

        Route::post('/quizzes/{quiz}/questions', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'storeQuestion',
        ])->name('instructor.quiz-questions.store');

        Route::patch('/quiz-questions/{question}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'updateQuestion',
        ])->name('instructor.quiz-questions.update');

        Route::delete('/quiz-questions/{question}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'destroyQuestion',
        ])->name('instructor.quiz-questions.destroy');

        Route::post('/quiz-questions/{question}/options', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'storeOption',
        ])->name('instructor.quiz-options.store');

        Route::patch('/quiz-options/{option}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'updateOption',
        ])->name('instructor.quiz-options.update');

        Route::delete('/quiz-options/{option}', [
            \App\Http\Controllers\Api\V1\Instructor\QuizController::class,
            'destroyOption',
        ])->name('instructor.quiz-options.destroy');

        Route::get('/students', [
            \App\Http\Controllers\Api\V1\Instructor\StudentController::class,
            'index',
        ])->name('instructor.students.index');

        Route::get('/students/{student}', [
            \App\Http\Controllers\Api\V1\Instructor\StudentController::class,
            'show',
        ])->name('instructor.students.show');

        Route::get('/students/{student}/progress', [
            \App\Http\Controllers\Api\V1\Instructor\StudentController::class,
            'progress',
        ])->name('instructor.students.progress');

        Route::get('/students/{student}/assessments', [
            \App\Http\Controllers\Api\V1\Instructor\StudentController::class,
            'assessments',
        ])->name('instructor.students.assessments');

        Route::post('/announcements', [InstructorAnnouncementController::class, 'store'])->name('instructor.announcements.store');

        Route::get(
    '/courses/{course}/analytics',
    [
        \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
        'analytics',
    ]
)->name('instructor.courses.analytics');

Route::get(
    '/courses/{course}/students',
    [
        \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
        'students',
    ]
)->name('instructor.courses.students');

Route::get('/courses/{course}/feedback', [
    \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
    'feedback',
])->name('instructor.courses.feedback');

Route::get('/courses/{course}/certificates', [
    \App\Http\Controllers\Api\V1\Instructor\CourseController::class,
    'certificates',
])->name('instructor.courses.certificates');
    });


Route::middleware([
    'auth:sanctum',
    'verified',
])->prefix('v1')->group(function () {

Route::post(
    'courses',
    [CourseController::class, 'store']
)->name('courses.store');

 Route::post(
            '/sections',
            [SectionController::class, 'store']
        );

        Route::patch(
            '/sections/{section}',
            [SectionController::class, 'update']
        );

        Route::delete(
            '/sections/{section}',
            [SectionController::class, 'destroy']
        );

        Route::post(
            '/sections/{section}/publish',
            [SectionController::class, 'publish']
        );

        Route::post(
            '/sections/{section}/unpublish',
            [SectionController::class, 'unpublish']
        );

        Route::post(
            '/sections/{section}/reorder',
            [SectionController::class, 'reorder']
        );
       
        Route::post(
    '/lessons',
    [LessonController::class, 'store']
);

Route::patch(
    '/lessons/{lesson}',
    [LessonController::class, 'update']
);

Route::delete(
    '/lessons/{lesson}',
    [LessonController::class, 'destroy']
);

Route::post(
    '/lessons/{lesson}/publish',
    [LessonController::class, 'publish']
);

Route::post(
    '/lessons/{lesson}/unpublish',
    [LessonController::class, 'unpublish']
);

Route::post(
    '/lessons/{lesson}/reorder',
    [LessonController::class, 'reorder']
);
Route::post(
    '/lessons/{lesson}/complete',
    [LessonController::class, 'complete']
);
Route::patch(
    '/lessons/{lesson}/progress',
    [LessonController::class, 'updateProgress']
);

Route::get(
    '/media/{media}',
    [MediaController::class, 'show']
);
Route::post(
    '/media',
    [MediaController::class, 'store']
);
Route::delete(
    '/media/{media}',
    [MediaController::class, 'destroy']
);
Route::put(
    'courses/{course}',
    [CourseController::class, 'update']
)->name('courses.update');

Route::patch(
    'courses/{course}',
    [CourseController::class, 'update']
);
Route::get(
    '/lessons/{lesson}/progress',
    [LessonController::class, 'progress']
);

Route::delete(
    'courses/{course}',
    [CourseController::class, 'destroy']
)->name('courses.destroy');

Route::post(
    'courses/{course}/submit-review',
    [CourseController::class, 'submitForReview']
)->name('courses.submit-review');

Route::post(
    'courses/{course}/archive',
    [CourseController::class, 'archive']
)->name('courses.archive');

Route::post(
    'courses/{course}/restore',
    [CourseController::class, 'restore']
)->name('courses.restore');
   
    Route::post(
    'courses/{course}/publish',
    [CourseController::class, 'publish']
);

Route::post(
    'courses/{course}/feedback',
    [CourseFeedbackController::class, 'store']
)->name('courses.feedback.store');
});



Route::middleware('auth:sanctum')->group(function () {
    Route::get(
        '/courses/{course}/progress',
        [CourseProgressController::class, 'show']
    );

    Route::post(
        '/courses/{course}/progress/sync',
        [CourseProgressController::class, 'sync']
    );
});
use App\Domains\AI\Http\Controllers\MentorConversationController;
Route::prefix('v1')->group(function () {

    // Public visitors can inspect published public course curricula and open
    // only lessons explicitly flagged as previews. Full lessons are guarded
    // by LessonAccessService and require an enrollment.
    Route::get(
        '/courses/{course}/curriculum',
        [CourseController::class, 'curriculum']
    )->name('courses.curriculum');

    Route::get(
        '/lessons/{lesson}',
        [LessonController::class, 'show']
    )->name('lessons.show');

    Route::get(
        '/catalog/courses',
        [
            \App\Http\Controllers\Api\V1\CatalogController::class,
            'courses'
        ]
    )->name('catalog.courses');

    Route::get(
        '/catalog/courses/{course}',
        [
            \App\Http\Controllers\Api\V1\CatalogController::class,
            'show'
        ]
    )->name('catalog.courses.show');

    Route::get(
    '/media/{media}/stream',
    MediaStreamController::class
)->name('media.stream');


Route::post('/quizzes', [QuizController::class, 'store']);
Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);



Route::middleware('auth:sanctum')
    ->prefix('mentor')
    ->group(function () {
        Route::get(
            'conversations',
            [MentorConversationController::class, 'index']
        );

        Route::post(
            'conversations',
            [MentorConversationController::class, 'store']
        );

        Route::get(
            'conversations/{conversation}',
            [MentorConversationController::class, 'show']
        );

        Route::patch(
            'conversations/{conversation}',
            [MentorConversationController::class, 'update']
        );

        Route::delete(
            'conversations/{conversation}',
            [MentorConversationController::class, 'destroy']
        );
       
    Route::post(
        '/conversations/{conversation}/messages',
        SendMentorMessageController::class
    );
     Route::post(
        '/conversations/{conversation}/messages/stream',
        StreamMentorMessageController::class,
    );
    Route::post(
    '/messages/{message}/feedback',
    SubmitMentorMessageFeedbackController::class
);
Route::get(
    '/conversations/{conversation}/analytics',
    [MentorConversationAnalyticsController::class, 'show']
);
    Route::post('/tools/voltage-drop', [MentorDiagnosticToolController::class, 'voltageDrop']);
    Route::post('/tools/diagnostic-checklist', [MentorDiagnosticToolController::class, 'checklist']);
    });
});

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    // Existing authenticated routes...
    Route::get('/assessments', [AssessmentController::class, 'index']);
    Route::get('/courses/{course}/quizzes', [QuizController::class, 'courseQuizzes']);

    Route::prefix('quizzes/{quiz}/attempts')
        ->controller(QuizAttemptController::class)
        ->group(function () {
            Route::get('/', 'index')
                ->name('quizzes.attempts.index');

            Route::post('/', 'store')
                ->name('quizzes.attempts.store');

            Route::get('/{attempt}', 'show')
                ->name('quizzes.attempts.show');

            Route::post('/{attempt}/submit', 'submit')
                ->name('quizzes.attempts.submit');
            Route::post('/{attempt}/expire', 'expire')
                ->name('quizzes.attempts.expire');
            Route::post('/{attempt}/tab-switch', 'tabSwitch');

            Route::get('/{attempt}/result', 'result')
                ->name('quizzes.attempts.result');
        });
        Route::prefix('assessments/{assessment}/attempts')
    
    ->group(function () {
        Route::get('/', [
            AssessmentAttemptController::class,
            'index',
        ])->name('assessments.attempts.index');

        Route::post('/', [
            AssessmentAttemptController::class,
            'store',
        ])->name('assessments.attempts.store');

        Route::get('/{attempt}', [
            AssessmentAttemptController::class,
            'show',
        ])->name('assessments.attempts.show');

        Route::post('/{attempt}/submit', [
            AssessmentAttemptController::class,
            'submit',
        ])->name('assessments.attempts.submit');
        Route::post('/{attempt}/expire', [
            AssessmentAttemptController::class,
            'expire',
        ])->name('assessments.attempts.expire');
        Route::post('/{attempt}/tab-switch', [AssessmentAttemptController::class, 'tabSwitch']);

        Route::get('/{attempt}/result', [
            AssessmentAttemptController::class,
            'result',
        ])->name('assessments.attempts.result');
    });
});



Route::middleware('auth:sanctum')
    ->prefix('sessions')
    ->group(function () {

        Route::get('/', [SessionController::class, 'index']);

        Route::get('/current', [SessionController::class, 'current']);

        Route::delete('/others', [SessionController::class, 'destroyOthers']);

        Route::delete('/{session}', [SessionController::class, 'destroy']);

    });


Route::get(
    '/verify-email/{id}/{hash}',
    [EmailVerificationController::class, 'verify']
)
->middleware('signed')
->name('verification.verify');



Route::middleware([
    'auth:sanctum',
    'verified',
])->prefix('v1')->group(function () {

    

        route::get(
            'categories/roots',
            [CategoryController::class, 'roots']
        )->name('categories.roots');
        route::get(
            'categories/leaves',
            [CategoryController::class, 'leaves']
        )->name('categories.leaves');
        route::get(
            'categories/active',
            [CategoryController::class, 'active']
        )->name('categories.active');
        route::get(
            'categories/inactive',
            [CategoryController::class, 'inactive']
        )->name('categories.inactive');
        route::get(
            'categories/tree',
            [CategoryController::class, 'tree']
        )->name('categories.tree');
        route::get(
    'categories/{category}/breadcrumb',
    [CategoryController::class, 'breadcrumb']
)->name('categories.breadcrumb');

        route::post(
            'categories/attach',
            [CategoryController::class, 'attach']
        )->name('categories.attach');
       route::delete(
    '/categories/detach',
    [CategoryController::class, 'detach']
)->name('categories.detach');

        route::get(
            'categories/{category}/courses',
            [CategoryController::class, 'courses']
        )->name('categories.courses');
        route::get(
            'categories/{category}/children',
            [CategoryController::class, 'children']
        )->name('categories.children');
        route::get(
            'categories/{category}/ancestors',
            [CategoryController::class, 'ancestors']
        )->name('categories.ancestors');
        route::get(
            'categories/{category}/descendants',
            [CategoryController::class, 'descendants']
        )->name('categories.descendants');
        route::get(
            'categories/{category}/siblings',
            [CategoryController::class, 'siblings']
        )->name('categories.siblings');
        route::get(
            'categories/{category}/parent',
            [CategoryController::class, 'parent']
        )->name('categories.parent');
        route::get(
            'categories/{category}/root',
            [CategoryController::class, 'root']
        )->name('categories.root');
        route::get(
            'categories/{category}/is-root',
            [CategoryController::class, 'isRoot']
        )->name('categories.is-root');
        route::get(
            'categories/{category}/is-leaf',
            [CategoryController::class, 'isLeaf']
        )->name('categories.is-leaf');
        route::get(
            'categories/{category}/is-ancestor-of/{otherCategory}',
            [CategoryController::class, 'isAncestorOf']
        )->name('categories.is-ancestor-of');

        Route::apiResource('categories', CategoryController::class)
        ->only([
            'index',
            'store',
            'show',
            'update',
            'destroy',
        ]);

});
