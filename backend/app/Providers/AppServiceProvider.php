<?php

namespace App\Providers;

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
use App\Contracts\Repositories\CourseRepositoryInterface;
use App\Repositories\CourseRepository;
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



class AppServiceProvider extends ServiceProvider
{

protected $listen = [

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
    CourseRepositoryInterface::class,
    CourseRepository::class

);
$this->app->bind(
    CategoryRepositoryInterface::class,
    CategoryRepository::class
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
        Category::class,
        CategoryPolicy::class
    );

    Event::listen(
        ModelChanged::class,
        WriteAuditLog::class,
    );
}
}