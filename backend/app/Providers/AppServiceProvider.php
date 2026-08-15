<?php

namespace App\Providers;

use App\Domains\Enrollments\Repositories\EnrollmentRepository;
use App\Domains\Enrollments\Repositories\EnrollmentRepositoryInterface;
use App\Domains\Enrollments\Repositories\EloquentEnrollmentRepository;
use App\Domains\Enrollments\Policies\EnrollmentPolicy;
use App\Models\Enrollment;

use App\Contracts\Services\AuthenticationServiceInterface;
use App\Services\AuthenticationService;
use Illuminate\Support\ServiceProvider;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\UserRepository;
use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use App\Events\ModelChanged;
use App\Listeners\WriteAuditLog;
use Illuminate\Support\Facades\Event;
use App\Models\Course;
use App\Domains\Courses\Policies\CoursePolicy;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Repositories\CourseRepository;
use App\Domains\Courses\Repositories\SectionProgressRepositoryInterface;
use App\Domains\Courses\Repositories\EloquentSectionProgressRepository;
use App\Domains\Courses\Repositories\CourseProgressRepositoryInterface;
use App\Domains\Courses\Repositories\EloquentCourseProgressRepository;
use App\Domains\Taxonomy\Repositories\CategoryRepository;
use App\Domains\Taxonomy\Repositories\CategoryRepositoryInterface;
use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Domains\Taxonomy\Events\CategoryUpdated;
use App\Domains\Taxonomy\Events\CategoryDeleted;
use App\Domains\Taxonomy\Events\CategoryAttachedToCourse;
use App\Domains\Taxonomy\Events\CategoryDetachedFromCourse;
use App\Domains\Taxonomy\Listeners\RecordCategoryAudit;
use App\Domains\Taxonomy\Listeners\RecordCategoryUpdatedAudit;
use App\Domains\Taxonomy\Listeners\RecordCategoryDeletedAudit;
use App\Domains\Taxonomy\Listeners\RecordCategoryAttachedAudit;
use App\Domains\Taxonomy\Listeners\RecordCategoryDetachedAudit;
use App\Domains\Taxonomy\Listeners\InvalidateCategoryCache;
use App\Domains\Taxonomy\Listeners\InvalidateCourseCategoryCache;
use App\Domains\Taxonomy\Listeners\IndexCategory;
use App\Domains\Taxonomy\Listeners\RemoveCategoryFromSearch;
use App\Models\Category;
use App\Domains\Taxonomy\Policies\CategoryPolicy;
use App\Domains\Courses\Repositories\EloquentSectionRepository;
use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Domains\Courses\Policies\SectionPolicy;
use App\Models\Section;
use App\Domains\Lessons\Repositories\EloquentLessonRepository;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Models\Lesson;
use App\Domains\Lessons\Policies\LessonPolicy;
use App\Domains\Lessons\Events\LessonCreated;
use App\Domains\Lessons\Events\LessonUpdated;
use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Lessons\Events\LessonUnpublished;
use App\Domains\Lessons\Events\LessonReordered; 
use App\Domains\Media\Repositories\EloquentMediaRepository;
use App\Domains\Media\Repositories\MediaRepositoryInterface;
use App\Models\Media;
use App\Domains\Media\Policies\MediaPolicy;
use App\Domains\Courses\Repositories\EloquentCourseRepository;
use App\Domains\Courses\Events\CourseArchived;
use App\Domains\Courses\Events\CourseCreated;
use App\Domains\Courses\Events\CourseDeleted;
use App\Domains\Courses\Events\CoursePublished;
use App\Domains\Courses\Events\CourseRestored;
use App\Domains\Courses\Events\CourseSubmittedForReview;
use App\Domains\Courses\Events\CourseUpdated;
use App\Domains\Lessons\Events\LessonDeleted;

use App\Domains\Courses\Listeners\RecordCourseArchivedAudit;
use App\Domains\Courses\Listeners\RecordCourseCreatedAudit;
use App\Domains\Courses\Listeners\RecordCourseDeletedAudit;
use App\Domains\Courses\Listeners\RecordCoursePublishedAudit;
use App\Domains\Courses\Listeners\RecordCourseRestoredAudit;
use App\Domains\Courses\Listeners\RecordCourseSubmittedForReviewAudit;
use App\Domains\Courses\Listeners\RecordCourseUpdatedAudit;

use App\Domains\Lessons\Listeners\RecordLessonCreatedAudit;
use App\Domains\Lessons\Listeners\RecordLessonUpdatedAudit;
use App\Domains\Lessons\Listeners\RecordLessonPublishedAudit;
use App\Domains\Lessons\Listeners\RecordLessonUnpublishedAudit;
use App\Domains\Lessons\Listeners\RecordLessonReorderedAudit;
use App\Domains\Lessons\Listeners\RecordLessonDeletedAudit;

use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Domains\Enrollments\Events\EnrollmentCompleted;
use App\Domains\Enrollments\Events\EnrollmentCancelled;

use App\Domains\Lessons\Events\LessonCompleted;
use App\Domains\Lessons\Events\LessonProgressUpdated;

use App\Domains\Lessons\Listeners\RecordLessonCompletedAudit;
use App\Domains\Courses\Listeners\SyncSectionProgress;

use App\Domains\Enrollments\Listeners\RecordEnrollmentCreatedAudit;
use App\Domains\Enrollments\Listeners\RecordEnrollmentCompletedAudit;
use App\Domains\Enrollments\Listeners\RecordEnrollmentCancelledAudit;

use App\Domains\Lessons\Repositories\LessonProgressRepositoryInterface;
use App\Domains\Lessons\Repositories\EloquentLessonProgressRepository;

use App\Domains\Courses\Events\SectionProgressUpdated;
use App\Domains\Courses\Listeners\SyncCourseProgress;


class AppServiceProvider extends ServiceProvider
{


protected $listen = [


     LessonProgressUpdated::class => [
        SyncSectionProgress::class,
    ],

    CategoryCreated::class => [
        RecordCategoryAudit::class,
        InvalidateCategoryCache::class,
        IndexCategory::class,
    ],

    CategoryUpdated::class => [
        RecordCategoryUpdatedAudit::class,
        InvalidateCategoryCache::class,
        IndexCategory::class,
    ],

    CategoryDeleted::class => [
        RecordCategoryDeletedAudit::class,
        InvalidateCategoryCache::class,
        RemoveCategoryFromSearch::class,
    ],

    CategoryAttachedToCourse::class => [
        RecordCategoryAttachedAudit::class,
        InvalidateCourseCategoryCache::class,
    ],

    CategoryDetachedFromCourse::class => [
        RecordCategoryDetachedAudit::class,
        InvalidateCourseCategoryCache::class,
    ],
];
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class
        );

        $this->app->bind(
    AuthenticationServiceInterface::class,
    AuthenticationService::class
    );
    $this->app->bind(
    SectionRepositoryInterface::class,
    EloquentSectionRepository::class
);

$this->app->bind(
    CourseRepositoryInterface::class,
    CourseRepository::class
);
$this->app->bind(
    CategoryRepositoryInterface::class,
    CategoryRepository::class
);
$this->app->bind(
    LessonRepositoryInterface::class,
    EloquentLessonRepository::class
);
$this->app->bind(
    MediaRepositoryInterface::class,
    EloquentMediaRepository::class
);

$this->app->bind(
    EnrollmentRepositoryInterface::class,
    EloquentEnrollmentRepository::class
);
$this->app->bind(
    LessonProgressRepositoryInterface::class,
    EloquentLessonProgressRepository::class
);
$this->app->bind(
    SectionProgressRepositoryInterface::class,
    EloquentSectionProgressRepository::class
);
$this->app->bind(
CourseProgressRepositoryInterface::class,
EloquentCourseProgressRepository::class
);

    }
    /**
     * Bootstrap any application services.
     */
   public function boot(): void
{
    Gate::policy(
        Course::class,
        CoursePolicy::class
    );

   Gate::policy(
    Enrollment::class,
    EnrollmentPolicy::class
);

    Gate::policy(
        Category::class,
        CategoryPolicy::class
    );

    Gate::policy(
    Section::class,
    SectionPolicy::class
);
Gate::policy(
    Lesson::class,
    LessonPolicy::class
);
Gate::policy(
    Media::class,
    MediaPolicy::class
);
    Event::listen(
        ModelChanged::class,
        WriteAuditLog::class,
    );
   Event::listen(
CourseCreated::class,
RecordCourseCreatedAudit::class,
);

Event::listen(
CourseUpdated::class,
RecordCourseUpdatedAudit::class,
);

Event::listen(
CoursePublished::class,
RecordCoursePublishedAudit::class,
);

Event::listen(
CourseSubmittedForReview::class,
RecordCourseSubmittedForReviewAudit::class,
);

Event::listen(
CourseArchived::class,
RecordCourseArchivedAudit::class,
);

Event::listen(
CourseRestored::class,
RecordCourseRestoredAudit::class,
);
Event::listen(
    LessonCompleted::class,
    RecordLessonCompletedAudit::class,
);
Event::listen(
    LessonProgressUpdated::class,
    SyncSectionProgress::class,
);
Event::listen(
    SectionProgressUpdated::class,
    SyncCourseProgress::class
);
Event::listen(
CourseDeleted::class,
RecordCourseDeletedAudit::class,
);

Event::listen(
    LessonCreated::class,
    RecordLessonCreatedAudit::class,
);

Event::listen(
    LessonUpdated::class,
    RecordLessonUpdatedAudit::class,
);

Event::listen(
    LessonPublished::class,
    RecordLessonPublishedAudit::class,
);

Event::listen(
    LessonUnpublished::class,
    RecordLessonUnpublishedAudit::class,
);

Event::listen(
    LessonReordered::class,
    RecordLessonReorderedAudit::class,
);

Event::listen(
    LessonDeleted::class,
    RecordLessonDeletedAudit::class,
);

Event::listen(
    EnrollmentCreated::class,
    RecordEnrollmentCreatedAudit::class,
);

Event::listen(
    EnrollmentCompleted::class,
    RecordEnrollmentCompletedAudit::class,
);

Event::listen(
    EnrollmentCancelled::class,
    RecordEnrollmentCancelledAudit::class,
);
}
}