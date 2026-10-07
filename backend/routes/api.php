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
use App\Http\Controllers\Api\V1\PlatformFeedbackController;
use App\Http\Controllers\Api\V1\CertificateController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\MediaStreamController;
use App\Http\Controllers\Api\CourseProgressController;
use App\Domains\AI\Http\Controllers\SendMentorMessageController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PhoneVerificationController;
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
use App\Domains\Admin\Controllers\AdminCrmController;
use App\Domains\Admin\Controllers\AdminActivityController;
use App\Domains\Admin\Controllers\AdminSystemController;
use App\Domains\Admin\Controllers\AdminNotificationController;
use App\Domains\Admin\Controllers\AdminAssessmentController;
use App\Domains\Admin\Controllers\AdminCanonicalPaymentsController;
use App\Domains\Admin\Controllers\AdminCommerceController;
use App\Domains\Admin\Controllers\AdminDiagnosticController;
use App\Domains\Admin\Controllers\AdminInstructorController;
use App\Domains\Admin\Controllers\AdminPlanController;
use App\Domains\Admin\Controllers\AdminQuizController;
use App\Domains\Admin\Controllers\AdminRoleController;
use App\Domains\Admin\Controllers\AdminSecurityController;
use App\Domains\Admin\Controllers\AdminStudentController;
use App\Domains\Admin\Controllers\AdminSupportController;
use App\Domains\DiagnosticScenarios\Controllers\InstructorDiagnosticController;
use App\Domains\RiskManagement\Controllers\RiskController;
use App\Domains\RiskManagement\Controllers\RiskReportController;
use App\Domains\RiskManagement\Controllers\SecurityIncidentController;
use App\Http\Controllers\Api\V1\StudentScenarioController;
use App\Domains\Instructor\Controllers\InstructorAnnouncementController;
use App\Domains\Messaging\Controllers\ConversationController as MessagingConversationController;
use App\Domains\Messaging\Controllers\MessageController as MessagingMessageController;
use App\Domains\Messaging\Controllers\StaffHubController;
use App\Http\Controllers\Api\V1\LocaleController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\ConfigController;
use App\Domains\Payments\Controllers\SubscriptionController;
use App\Domains\Payments\Http\Controllers\BillingController;
use App\Domains\Payments\Http\Controllers\CheckoutController;
use App\Domains\Payments\Http\Controllers\PaymentMethodController;
use App\Domains\Payments\Http\Controllers\WebhookController;
use App\Domains\Simulator\Controllers\SimulatorSessionController;
use App\Domains\Simulator\Controllers\InstructorSimulatorActivityController;
use App\Domains\Simulator\Controllers\AdminSimulatorActivityController;




Route::prefix('v1')->group(function () {

    // Public contact form + public config/plans so landing pages work without login.
    Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:10,1');
    // Public ticket status lookup (ticket UUID + the address it was filed with).
    Route::get('/support/tickets/{ticket}/status', [\App\Domains\Support\Controllers\TicketController::class, 'status'])
        ->middleware('throttle:10,1');
    // Conversion funnel events (pricing view, plan CTA, simulator limit hit).
    Route::post('/analytics/events', \App\Domains\Analytics\Http\Controllers\StoreAnalyticsEventController::class)
        ->middleware('throttle:60,1');
    Route::get('/config/stripe-key', [ConfigController::class, 'stripeKey']);
    Route::get('/plans', [SubscriptionController::class, 'plans']);
    // Provider webhooks are verified by signature inside the controller.
    Route::post('/webhooks/stripe', [WebhookController::class, 'stripe']);
    Route::post('/webhooks/paypal', [WebhookController::class, 'paypal']);

    // Certificate verification is intentionally public so QR scans work without a login.
    Route::get('/certificates/verify/{certificateNumber}', [CertificateController::class, 'verify']);

    // Message attachments travel on temporary signed URLs (plain <a>/<img>
    // requests carry no Bearer token); participation is enforced in the controller.
    Route::get(
        '/messages/attachments/{message}',
        [MessagingMessageController::class, 'download']
    )
    ->middleware('signed')
    ->name('messages.attachments.download');

    Route::prefix('auth')->group(function () {

        Route::get('/google/redirect', [GoogleAuthController::class, 'redirect']);
        Route::get('/google/callback', [GoogleAuthController::class, 'callback']);
        Route::post('/google/exchange', [GoogleAuthController::class, 'exchange'])->middleware('throttle:auth');

     Route::post(
            '/register',
            [AuthController::class, 'register']
        )->middleware('throttle:auth');

Route::post(
    '/login',
    [AuthController::class, 'login']
)->middleware('throttle:auth');
Route::post('/two-factor/login/verify', [AuthController::class, 'verifyTwoFactorLogin'])->middleware('throttle:two-factor-verify');
Route::post('/two-factor/login/resend', [AuthController::class, 'resendTwoFactorLogin'])->middleware('throttle:5,1');
Route::post(
    '/forgot-password',
    [AuthController::class, 'forgotPassword']
)->middleware('throttle:password-reset');
Route::post(
    '/reset-password',
    [AuthController::class, 'resetPassword']
)->middleware('throttle:password-reset');
Route::post(
    '/email/resend-unverified',
    [\App\Http\Controllers\Api\V1\Auth\EmailVerificationController::class, 'resendForEmail']
)->middleware('throttle:6,1');

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('/logout', [AuthController::class, 'logout']);

            Route::get('/me', [AuthController::class, 'me']);

            Route::post('/email/resend', [\App\Http\Controllers\Api\V1\Auth\EmailVerificationController::class, 'resend'])
                ->middleware('throttle:6,1');

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
Route::patch('/locale', [LocaleController::class, 'update']);
Route::post('/phone/otp/send', [PhoneVerificationController::class, 'send'])
    ->middleware('throttle:6,1');
Route::post('/phone/otp/verify', [PhoneVerificationController::class, 'verify'])
    ->middleware('throttle:10,1');
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
            Route::patch('users/{user}/verify', [UserController::class, 'verify']);
            Route::patch('users/{user}/unverify', [UserController::class, 'unverify']);
            Route::patch('users/{user}/status', [UserController::class, 'changeStatus']);
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

            Route::get('crm/stats', [AdminCrmController::class, 'stats']);

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

            Route::get('simulator/analytics', [AdminSimulatorActivityController::class, 'analytics']);
            Route::get('simulator/sessions', [AdminSimulatorActivityController::class, 'sessions']);
            Route::get('students/{student}/simulator', [AdminSimulatorActivityController::class, 'studentSessions']);
            Route::get('students/{student}/simulator/results', [AdminSimulatorActivityController::class, 'studentResults']);

            Route::get('diagnostics/analytics', [AdminDiagnosticController::class, 'analytics']);
            Route::get('diagnostics', [AdminDiagnosticController::class, 'index']);
            Route::post('diagnostics', [AdminDiagnosticController::class, 'store']);
            Route::get('diagnostics/{scenario}', [AdminDiagnosticController::class, 'show']);
            Route::patch('diagnostics/{scenario}', [AdminDiagnosticController::class, 'update']);
            Route::post('diagnostics/{scenario}/publish', [AdminDiagnosticController::class, 'publish']);
            Route::post('diagnostics/{scenario}/unpublish', [AdminDiagnosticController::class, 'unpublish']);
            Route::post('diagnostics/{scenario}/archive', [AdminDiagnosticController::class, 'archive']);
            Route::post('diagnostics/{scenario}/fork', [AdminDiagnosticController::class, 'forkVersion']);
            Route::post('diagnostics/{scenario}/versions', [AdminDiagnosticController::class, 'forkVersion']);
            Route::post('diagnostics/{scenario}/steps', [AdminDiagnosticController::class, 'storeStep']);
            Route::patch('diagnostic-steps/{step}', [AdminDiagnosticController::class, 'updateStep']);
            Route::delete('diagnostic-steps/{step}', [AdminDiagnosticController::class, 'destroyStep']);
            Route::post('diagnostics/{scenario}/criteria', [AdminDiagnosticController::class, 'storeCriterion']);
            Route::patch('diagnostic-criteria/{criterion}', [AdminDiagnosticController::class, 'updateCriterion']);
            Route::delete('diagnostic-criteria/{criterion}', [AdminDiagnosticController::class, 'destroyCriterion']);
            Route::post('diagnostics/{scenario}/hints', [AdminDiagnosticController::class, 'storeHint']);
            Route::patch('diagnostic-hints/{hint}', [AdminDiagnosticController::class, 'updateHint']);
            Route::delete('diagnostic-hints/{hint}', [AdminDiagnosticController::class, 'destroyHint']);
            Route::post('diagnostics/{scenario}/assignments', [AdminDiagnosticController::class, 'storeAssignment']);
            Route::delete('diagnostic-assignments/{assignment}', [AdminDiagnosticController::class, 'destroyAssignment']);

            Route::get('quizzes', [AdminQuizController::class, 'index']);
            Route::get('quizzes/{quiz}', [AdminQuizController::class, 'show']);
            Route::patch('quizzes/{quiz}', [AdminQuizController::class, 'update']);
            Route::post('quizzes/{quiz}/disable', [AdminQuizController::class, 'disable']);
            Route::delete('quizzes/{quiz}', [AdminQuizController::class, 'destroy']);
            Route::get('quizzes/{quiz}/attempts', [AdminQuizController::class, 'attempts']);

            Route::get('assessments', [AdminAssessmentController::class, 'index']);
            Route::get('assessments/{assessment}', [AdminAssessmentController::class, 'show']);
            Route::patch('assessments/{assessment}', [AdminAssessmentController::class, 'update']);
            Route::post('assessments/{assessment}/disable', [AdminAssessmentController::class, 'disable']);
            Route::delete('assessments/{assessment}', [AdminAssessmentController::class, 'destroy']);
            Route::get('assessments/{assessment}/attempts', [AdminAssessmentController::class, 'attempts']);

            Route::get('commerce/overview', [AdminCommerceController::class, 'overview']);
            Route::get('commerce/transactions', [AdminCommerceController::class, 'transactions']);
            Route::get('commerce/transactions/{transaction}', [AdminCommerceController::class, 'showTransaction']);
            Route::post('commerce/transactions/{transaction}/confirm', [AdminCommerceController::class, 'confirmTransaction']);
            Route::post('commerce/transactions/{transaction}/fail', [AdminCommerceController::class, 'failTransaction']);
            Route::post('commerce/transactions/{transaction}/refund', [AdminCommerceController::class, 'refund']);
            Route::get('commerce/refunds', [AdminCommerceController::class, 'refunds']);
            Route::get('commerce/subscriptions', [AdminCommerceController::class, 'subscriptions']);
            Route::post('commerce/subscriptions/grant', [AdminCommerceController::class, 'grantSubscription']);
            Route::post('commerce/subscriptions/{subscription}/cancel', [AdminCommerceController::class, 'cancelSubscription']);
            Route::get('commerce/payouts', [AdminCommerceController::class, 'payouts']);
            Route::post('commerce/payouts', [AdminCommerceController::class, 'recordPayout']);
            Route::post('commerce/payouts/auto-generate', [AdminCommerceController::class, 'autoGeneratePayouts']);
            Route::post('commerce/payouts/{payout}/pay', [AdminCommerceController::class, 'markPayoutPaid']);

            Route::get('plans', [AdminPlanController::class, 'index']);
            Route::post('plans', [AdminPlanController::class, 'store']);
            Route::patch('plans/{plan}', [AdminPlanController::class, 'update']);
            Route::delete('plans/{plan}', [AdminPlanController::class, 'destroy']);

            Route::get('payments/orders', [AdminCanonicalPaymentsController::class, 'orders']);
            Route::get('payments/orders/{order}', [AdminCanonicalPaymentsController::class, 'showOrder']);
            Route::get('payments/invoices', [AdminCanonicalPaymentsController::class, 'invoices']);
            Route::get('payments/webhooks', [AdminCanonicalPaymentsController::class, 'webhookEvents']);
            Route::post('payments/webhooks/{webhookEvent}/replay', [AdminCanonicalPaymentsController::class, 'replayWebhook']);
            Route::get('payments/failed', [AdminCanonicalPaymentsController::class, 'failedPayments']);
            Route::post('payments/{payment}/refund', [AdminCanonicalPaymentsController::class, 'refundPayment']);

            Route::get('support/tickets', [AdminSupportController::class, 'index']);
            Route::get('support/tickets/{ticket}', [AdminSupportController::class, 'show']);
            Route::post('support/tickets/{ticket}/replies', [AdminSupportController::class, 'reply']);
            Route::patch('support/tickets/{ticket}/assign', [AdminSupportController::class, 'assign']);
            Route::post('support/tickets/{ticket}/escalate', [AdminSupportController::class, 'escalate']);
            Route::post('support/tickets/{ticket}/resolve', [AdminSupportController::class, 'resolve']);
            Route::post('support/tickets/{ticket}/close', [AdminSupportController::class, 'close']);

            Route::get('students', [AdminStudentController::class, 'index']);
            Route::get('students/{student}', [AdminStudentController::class, 'show']);

            Route::get('instructors', [AdminInstructorController::class, 'index']);
            Route::get('instructors/{instructor}', [AdminInstructorController::class, 'show']);

            Route::get('risks-dashboard', [RiskController::class, 'dashboard']);
            Route::get('security/overview', [AdminSecurityController::class, 'overview']);
            Route::get('security/auth-logs', [AdminSecurityController::class, 'authLogs']);
            Route::get('security/sessions', [AdminSecurityController::class, 'sessions']);
            Route::post('security/sessions/{session}/revoke', [AdminSecurityController::class, 'revokeSession']);
            Route::get('security/alerts', [AdminSecurityController::class, 'alerts']);

            Route::get('risks-dashboard', [RiskController::class, 'dashboard']);
            Route::get('risks', [RiskController::class, 'index']);
            Route::post('risks', [RiskController::class, 'store']);
            Route::get('risks/{risk}', [RiskController::class, 'show']);
            Route::get('risk-reports/overdue', [RiskReportController::class, 'overdue']);
            Route::get('risk-reports/failed-controls', [RiskReportController::class, 'failedControls']);
            Route::get('security-incidents', [SecurityIncidentController::class, 'index']);
        });


// Access control is Super Admin-only: role definitions and permission grants
// shape the whole platform. Admins manage people and content, not the
// permission model itself.
Route::middleware([
    'auth:sanctum',
    'verified',
    'role:Super Admin',
])
    ->prefix('admin')
    ->group(function () {
        Route::get('roles', [AdminRoleController::class, 'index']);
        Route::put('roles/{roleName}/permissions', [AdminRoleController::class, 'updatePermissions']);
    });


});

Route::middleware([
    'auth:sanctum',
    'verified',
])->prefix('v1')->group(function () {

Route::get('/certificates', [CertificateController::class, 'index']);
    Route::get('/simulator/catalog', [\App\Domains\Simulator\Controllers\StudentSimulatorCatalogController::class, 'vehicles']);
    Route::get('/simulator/training-sessions', [\App\Domains\Simulator\Controllers\StudentSimulatorCatalogController::class, 'trainingSessions']);
    Route::get('/notifications', [StudentNotificationController::class, 'index']);
    Route::get('/notifications/sidebar-badges', [StudentNotificationController::class, 'sidebarBadges']);
    Route::patch('/notifications/read-all', [StudentNotificationController::class, 'readAll']);
    Route::patch('/notifications/category/{category}/read', [StudentNotificationController::class, 'markCategoryRead']);
    Route::patch('/notifications/{notification}/read', [StudentNotificationController::class, 'read']);

    Route::get('/favorites', [\App\Http\Controllers\Api\V1\FavoriteController::class, 'index']);
    Route::post('/favorites/toggle', [\App\Http\Controllers\Api\V1\FavoriteController::class, 'toggle']);
    Route::post('/favorites/status', [\App\Http\Controllers\Api\V1\FavoriteController::class, 'status']);

    Route::get('/support/tickets', [\App\Domains\Support\Controllers\TicketController::class, 'index']);
    Route::post('/support/tickets', [\App\Domains\Support\Controllers\TicketController::class, 'store']);
    Route::get('/support/tickets/{ticket}', [\App\Domains\Support\Controllers\TicketController::class, 'show']);
    Route::post('/support/tickets/{ticket}/reply', [\App\Domains\Support\Controllers\TicketController::class, 'reply']);
    Route::post('/support/tickets/{ticket}/close', [\App\Domains\Support\Controllers\TicketController::class, 'close']);
    Route::post('/support/tickets/{ticket}/rating', [\App\Domains\Support\Controllers\TicketController::class, 'rating']);

    Route::prefix('messages')->group(function () {
        Route::get('/conversations', [MessagingConversationController::class, 'index']);
        Route::get('/contacts', [MessagingConversationController::class, 'contacts']);
        Route::post('/conversations', [MessagingConversationController::class, 'store']);
        Route::get('/conversations/{conversation}', [MessagingConversationController::class, 'show']);
        Route::patch('/conversations/{conversation}/archive', [MessagingConversationController::class, 'archive']);
        Route::post('/conversations/{conversation}/messages', [MessagingMessageController::class, 'store'])->middleware('throttle:30,1');
        Route::get('/conversations/{conversation}/messages', [MessagingMessageController::class, 'index']);
        Route::delete('/{message}', [MessagingMessageController::class, 'destroy']);
        Route::post('/{message}/reactions', [MessagingMessageController::class, 'react']);
        Route::patch('/{message}', [MessagingMessageController::class, 'update']);
        Route::post('/{message}/forward', [MessagingMessageController::class, 'forward']);
        Route::patch('/conversations/{conversation}/read', [MessagingMessageController::class, 'read']);
        Route::patch('/conversations/{conversation}/mute', [MessagingConversationController::class, 'mute']);
        // Typing is fire-and-forget from the composer, so it needs its own
        // budget — it must never eat into the 30/min send throttle.
        Route::post('/conversations/{conversation}/typing', [MessagingMessageController::class, 'typing'])
            ->middleware('throttle:60,1');
    });

    // Staff Hub: the shared space where Admin, Super Admin, Support and
    // Instructor meet. Guarded by role rather than by `admin:` so Support and
    // Instructors are not locked out of the platform-wide staff audience.
    Route::middleware('role:Admin|Super Admin|Support|Instructor')
        ->prefix('staff-hub')
        ->group(function () {
            Route::get('/room', [StaffHubController::class, 'room']);
            Route::post('/news', [StaffHubController::class, 'storeNews']);
        });

    Route::prefix('student')->group(function () {
        Route::get('/scenarios', [StudentScenarioController::class, 'index']);
        Route::get('/scenarios/{scenario}', [StudentScenarioController::class, 'show']);
        Route::post('/scenarios/{scenario}/attempts', [StudentScenarioController::class, 'start']);
        Route::get('/scenario-attempts/history', [StudentScenarioController::class, 'history']);
        Route::get('/scenario-attempts/{attempt}', [StudentScenarioController::class, 'resume']);
        Route::put('/scenario-attempts/{attempt}/steps/{step}', [StudentScenarioController::class, 'answerStep']);
        Route::get('/scenario-attempts/{attempt}/hints', [StudentScenarioController::class, 'hints']);
        Route::post('/scenario-attempts/{attempt}/hints', [StudentScenarioController::class, 'useHint']);
        Route::post('/scenario-attempts/{attempt}/submit', [StudentScenarioController::class, 'submit']);
        Route::get('/scenario-attempts/{attempt}/result', [StudentScenarioController::class, 'result']);

        Route::get('/dashboard', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'dashboard']);
        Route::get('/assessments', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'index']);
        Route::get('/assessments/history', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'history']);
        Route::get('/assessments/recommendations', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'globalRecommendations']);
        Route::get('/assessments/{assessment}', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'show']);
        Route::post('/assessments/{assessment}/attempts', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'start']);

        Route::get('/assessment-attempts/{attempt}', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'resume']);
        Route::get('/assessment-attempts/{attempt}/navigation', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'navigation']);
        Route::put('/assessment-attempts/{attempt}/responses/{question}', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'saveResponse']);
        Route::post('/assessment-attempts/{attempt}/responses/{question}/flag', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'flag']);
        Route::get('/assessment-attempts/{attempt}/adaptive/next', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'adaptiveNext']);
        Route::post('/assessment-attempts/{attempt}/submit', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'submit']);
        Route::post('/assessment-attempts/{attempt}/abandon', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'abandon']);
        Route::get('/assessment-attempts/{attempt}/result', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'result']);
        Route::get('/assessment-attempts/{attempt}/competencies', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'competencies']);
        Route::get('/assessment-attempts/{attempt}/recommendations', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'recommendations']);
        Route::post('/assessment-attempts/{attempt}/integrity', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'recordIntegrityEvent']);
        Route::get('/assessment-attempts/{attempt}/integrity', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'integritySummary']);
        Route::get('/assessment-attempts/{attempt}/scenarios', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'scenarios']);
        Route::get('/assessment-attempts/{attempt}/scenarios/{scenarioId}', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'scenarioDetail']);
        Route::post('/assessment-attempts/{attempt}/scenarios/{scenarioId}/steps/{stepId}', [\App\Http\Controllers\Api\V1\StudentAssessmentController::class, 'answerScenarioStep']);
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

    Route::get('/certificates/{certificate}', [CertificateController::class, 'show']);
Route::get('/certificates/{certificate}/download', [CertificateController::class, 'download']);

    // Student commerce: plans list is public, but managing subscriptions/checkout requires auth.
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::post('/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('/subscriptions/{subscription}/change-plan', [SubscriptionController::class, 'changePlan']);

    Route::post('/checkout', [CheckoutController::class, 'store']);
    Route::get('/checkout/{orderId}', [CheckoutController::class, 'show']);

    Route::get('/payment-methods', [PaymentMethodController::class, 'index']);
    Route::post('/payment-methods', [PaymentMethodController::class, 'store']);
    Route::patch('/payment-methods/{paymentMethod}/default', [PaymentMethodController::class, 'setDefault']);
    Route::delete('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy']);

    // Learner billing history: orders, invoices and invoice PDF downloads.
    Route::get('/billing/orders', [BillingController::class, 'orders']);
    Route::get('/billing/invoices', [BillingController::class, 'invoices']);
    Route::get('/billing/invoices/{invoice}/download', [BillingController::class, 'invoiceDownload']);

    Route::get('/leaderboard', [\App\Http\Controllers\Api\V1\LeaderboardController::class, 'index']);
    Route::post('/leaderboard/bonus', [\App\Http\Controllers\Api\V1\LeaderboardController::class, 'bonus']);

    // Referral loop: mint/return invite code + funnel stats.
    Route::post('/referrals', [\App\Http\Controllers\Api\V1\ReferralController::class, 'store']);

    // Simulator sessions: start -> complete -> history. Frontend labs call these
    // so bench results persist instead of staying local-only.
    Route::get('/simulator/usage', [SimulatorSessionController::class, 'usage']);
    Route::post('/simulator/sessions', [SimulatorSessionController::class, 'store']);
    Route::post('/simulator/sessions/{session}/complete', [SimulatorSessionController::class, 'complete']);
    Route::get('/simulator/results', [SimulatorSessionController::class, 'results']);
    Route::get('/simulator/manifest/{scenario}', [SimulatorSessionController::class, 'manifest']);

    // Daily challenges: board, review, race leaderboard, peer activity, rivals
    Route::get('/challenges/today', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'today']);
    Route::get('/challenges/review', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'review']);
    Route::get('/challenges/leaderboard', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'leaderboard']);
    Route::get('/challenges/activity', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'activity']);
    Route::get('/challenges/peers', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'peers']);
    Route::get('/challenges/rivals', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'rivals']);
    Route::post('/challenges/rivals', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'challenge']);
    Route::post('/challenges/rivals/{id}/accept', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'accept']);
    Route::get('/challenges/rivals/{id}/share', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'share']);
    Route::post('/challenges/{id}/claim', [\App\Domains\Challenges\Controllers\StudentChallengeController::class, 'claim']);

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
            '/attention',
            [
                \App\Http\Controllers\Api\V1\Instructor\AttentionController::class,
                'index',
            ]
        )->name('instructor.attention');

        Route::get(
            '/trends',
            [
                \App\Http\Controllers\Api\V1\Instructor\TrendController::class,
                'index',
            ]
        )->name('instructor.trends');

        Route::get(
            '/progression',
            [
                \App\Http\Controllers\Api\V1\Instructor\ProgressionController::class,
                'index',
            ]
        )->name('instructor.progression');

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

        Route::get('/simulator/analytics', [
            InstructorSimulatorActivityController::class,
            'analytics',
        ])->name('instructor.simulator.analytics');

        Route::get('/simulator/sessions', [
            InstructorSimulatorActivityController::class,
            'sessions',
        ])->name('instructor.simulator.sessions');

        Route::get('/students/{student}/simulator', [
            InstructorSimulatorActivityController::class,
            'studentSessions',
        ])->name('instructor.students.simulator');

        Route::get('/students/{student}/simulator/results', [
            InstructorSimulatorActivityController::class,
            'studentResults',
        ])->name('instructor.students.simulator.results');

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

Route::get('/courses/{course}/assessments', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'index',
])->name('instructor.courses.assessments.index');
Route::post('/courses/{course}/assessments', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'store',
])->name('instructor.courses.assessments.store');
Route::get('/courses/{course}/assessments/reviews/pending', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'pendingReviews',
])->name('instructor.courses.assessments.reviews.pending');
Route::get('/courses/{course}/assessments/attempts/flagged', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'flaggedAttempts',
])->name('instructor.courses.assessments.attempts.flagged');
Route::get('/courses/{course}/assessments/flagged-attempts', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'flaggedAttempts',
])->name('instructor.courses.assessments.flagged-attempts');
Route::get('/courses/{course}/assessments/questions/available', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'availableQuestions',
])->name('instructor.courses.assessments.questions.available');
Route::get('/courses/{course}/assessments/competencies/available', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'availableCompetencies',
])->name('instructor.courses.assessments.competencies.available');
Route::get('/courses/{course}/assessments/{assessment}', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'show',
])->name('instructor.courses.assessments.show');
Route::match(['put', 'patch'], '/courses/{course}/assessments/{assessment}', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'update',
])->name('instructor.courses.assessments.update');
Route::delete('/courses/{course}/assessments/{assessment}', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'destroy',
])->name('instructor.courses.assessments.destroy');
Route::post('/courses/{course}/assessments/{assessment}/publish', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'publish',
])->name('instructor.courses.assessments.publish');
Route::post('/courses/{course}/assessments/{assessment}/unpublish', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'unpublish',
])->name('instructor.courses.assessments.unpublish');
Route::match(['put', 'patch', 'post'], '/courses/{course}/assessments/{assessment}/questions', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'syncQuestions',
])->name('instructor.courses.assessments.questions.sync');
Route::match(['put', 'patch', 'post'], '/courses/{course}/assessments/{assessment}/competencies', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'syncCompetencies',
])->name('instructor.courses.assessments.competencies.sync');
Route::post('/courses/{course}/assessments/attempts/{attempt}/regrade', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorAssessmentController::class,
    'regrade',
])->name('instructor.courses.assessments.attempts.regrade');

Route::get('/revenue', [
    \App\Http\Controllers\Api\V1\Instructor\InstructorRevenueController::class,
    'index',
])->name('instructor.revenue');

Route::get('/diagnostics/analytics', [InstructorDiagnosticController::class, 'analytics'])->name('instructor.diagnostics.analytics');
Route::get('/diagnostics/attempts', [InstructorDiagnosticController::class, 'attempts'])->name('instructor.diagnostics.attempts');
Route::get('/diagnostics/attempts/{attempt}', [InstructorDiagnosticController::class, 'showAttempt'])->name('instructor.diagnostics.attempts.show');
Route::get('/diagnostics/attempts/{attempt}/result', [InstructorDiagnosticController::class, 'result'])->name('instructor.diagnostics.attempts.result');
Route::get('/diagnostics', [InstructorDiagnosticController::class, 'index'])->name('instructor.diagnostics.index');
Route::post('/diagnostics', [InstructorDiagnosticController::class, 'store'])->name('instructor.diagnostics.store');
Route::get('/diagnostics/{scenario}', [InstructorDiagnosticController::class, 'show'])->name('instructor.diagnostics.show');
Route::put('/diagnostics/{scenario}', [InstructorDiagnosticController::class, 'update'])->name('instructor.diagnostics.update');
Route::post('/diagnostics/{scenario}/publish', [InstructorDiagnosticController::class, 'publish'])->name('instructor.diagnostics.publish');
Route::post('/diagnostics/{scenario}/unpublish', [InstructorDiagnosticController::class, 'unpublish'])->name('instructor.diagnostics.unpublish');
Route::post('/diagnostics/{scenario}/archive', [InstructorDiagnosticController::class, 'archive'])->name('instructor.diagnostics.archive');
    Route::post('/diagnostics/{scenario}/fork', [InstructorDiagnosticController::class, 'fork'])->name('instructor.diagnostics.fork');
    Route::post('/diagnostics/{scenario}/criteria', [InstructorDiagnosticController::class, 'storeCriterion'])->name('instructor.diagnostics.criteria.store');
    Route::patch('/diagnostics/criteria/{criterion}', [InstructorDiagnosticController::class, 'updateCriterion'])->name('instructor.diagnostics.criteria.update');
    Route::delete('/diagnostics/criteria/{criterion}', [InstructorDiagnosticController::class, 'destroyCriterion'])->name('instructor.diagnostics.criteria.destroy');
    Route::post('/diagnostics/{scenario}/hints', [InstructorDiagnosticController::class, 'storeHint'])->name('instructor.diagnostics.hints.store');
    Route::patch('/diagnostics/hints/{hint}', [InstructorDiagnosticController::class, 'updateHint'])->name('instructor.diagnostics.hints.update');
    Route::delete('/diagnostics/hints/{hint}', [InstructorDiagnosticController::class, 'destroyHint'])->name('instructor.diagnostics.hints.destroy');
    Route::post('/diagnostics/{scenario}/steps', [InstructorDiagnosticController::class, 'storeStep'])->name('instructor.diagnostics.steps.store');
Route::post('/diagnostics/{scenario}/steps/reorder', [InstructorDiagnosticController::class, 'reorderSteps'])->name('instructor.diagnostics.steps.reorder');
Route::patch('/diagnostics/steps/{step}', [InstructorDiagnosticController::class, 'updateStep'])->name('instructor.diagnostics.steps.update');
Route::delete('/diagnostics/steps/{step}', [InstructorDiagnosticController::class, 'destroyStep'])->name('instructor.diagnostics.steps.destroy');

Route::get('/simulator/vehicles', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'vehicles'])->name('instructor.simulator.vehicles');
Route::post('/simulator/vehicles/variants', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'storeVariant'])->name('instructor.simulator.variants.store');
Route::patch('/simulator/vehicles/variants/{variant}', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'updateVariant'])->name('instructor.simulator.variants.update');
Route::get('/simulator/variants/{variant}/packs', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'packs'])->name('instructor.simulator.packs.index');
Route::post('/simulator/variants/{variant}/packs', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'storePack'])->name('instructor.simulator.packs.store');
Route::patch('/simulator/packs/{pack}', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'updatePack'])->name('instructor.simulator.packs.update');
Route::post('/simulator/packs/{pack}/submit', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'submitPack'])->name('instructor.simulator.packs.submit');
Route::get('/simulator/review', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'reviewQueue'])->name('instructor.simulator.review');
Route::post('/simulator/packs/{pack}/approve', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'approvePack'])->name('instructor.simulator.packs.approve');
Route::post('/simulator/packs/{pack}/reject', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'rejectPack'])->name('instructor.simulator.packs.reject');
Route::post('/simulator/packs/{pack}/archive', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'archivePack'])->name('instructor.simulator.packs.archive');
Route::post('/simulator/packs/{pack}/restore', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'restorePack'])->name('instructor.simulator.packs.restore');
Route::delete('/simulator/packs/{pack}', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'destroyPack'])->name('instructor.simulator.packs.destroy');
Route::delete('/simulator/vehicles/variants/{variant}', [\App\Domains\Simulator\Controllers\InstructorSimulatorController::class, 'destroyVariant'])->name('instructor.simulator.variants.destroy');
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

Route::get('/lessons/{lesson}/notes', [\App\Http\Controllers\Api\V1\LessonNoteController::class, 'index']);
Route::post('/lessons/{lesson}/notes', [\App\Http\Controllers\Api\V1\LessonNoteController::class, 'store']);
Route::patch('/lessons/{lesson}/notes/{note}', [\App\Http\Controllers\Api\V1\LessonNoteController::class, 'update']);
Route::delete('/lessons/{lesson}/notes/{note}', [\App\Http\Controllers\Api\V1\LessonNoteController::class, 'destroy']);

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

// Platform-wide experience review (navigation/UX) — not tied to a course.
Route::get(
    'platform/feedback',
    [PlatformFeedbackController::class, 'index']
)->name('platform.feedback.index');

Route::post(
    'platform/feedback',
    [PlatformFeedbackController::class, 'store']
)->name('platform.feedback.store');
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
        '/courses/{course}/reviews',
        [CourseFeedbackController::class, 'index']
    )->name('courses.feedback.index');

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
        '/catalog/instructors',
        [
            \App\Http\Controllers\Api\V1\CatalogController::class,
            'instructors'
        ]
    )->name('catalog.instructors');

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


Route::middleware(['auth:sanctum', 'verified', 'role:Instructor|Admin|Super Admin'])
    ->post('/quizzes', [QuizController::class, 'store']);
Route::middleware('auth:sanctum')
    ->get('/quizzes/{quiz}', [QuizController::class, 'show']);



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
    Route::post('/practice-quiz', [\App\Domains\AI\Http\Controllers\MentorPracticeQuizController::class, 'generate']);
    });
});

Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    Route::post('/mentor/practice-quiz', [\App\Domains\AI\Http\Controllers\MentorPracticeQuizController::class, 'generate']);
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


// The controller validates the signature itself so expired links can send
// browsers to a friendly frontend message instead of a bare 403 page.
Route::get(
    '/verify-email/{id}/{hash}',
    [EmailVerificationController::class, 'verify']
)
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


// Support desk: ticket queue for Support agents (admins keep full access
// via /v1/admin/support/*). Policies gate every action to staff.
Route::middleware([
    'auth:sanctum',
    'verified',
    'role:Support|Admin|Super Admin',
])
    ->prefix('v1/support-desk')
    ->group(function () {
        Route::get('/overview', [\App\Domains\Support\Controllers\SupportDashboardController::class, 'overview']);
        Route::get('/tickets', [AdminSupportController::class, 'index']);
        Route::get('/tickets/{ticket}', [AdminSupportController::class, 'show']);
        Route::post('/tickets/{ticket}/replies', [AdminSupportController::class, 'reply']);
        Route::patch('/tickets/{ticket}/assign', [AdminSupportController::class, 'assign']);
        Route::post('/tickets/{ticket}/escalate', [AdminSupportController::class, 'escalate']);
        Route::post('/tickets/{ticket}/resolve', [AdminSupportController::class, 'resolve']);
        Route::post('/tickets/{ticket}/close', [AdminSupportController::class, 'close']);

        // Mailbox: contact-form submissions land in the inbox, agents answer
        // and compose from the same table (roots = one row per conversation).
        Route::get('/mail', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'index']);
        Route::get('/mail/recipients', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'recipients']);
        Route::get('/mail/{mail}', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'show']);
        Route::post('/mail', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'store']);
        Route::post('/mail/{mail}/reply', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'reply']);
        Route::patch('/mail/{mail}/read', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'read']);
        Route::patch('/mail/{mail}/archive', [\App\Domains\Support\Controllers\SupportMailboxController::class, 'archive']);
    });
