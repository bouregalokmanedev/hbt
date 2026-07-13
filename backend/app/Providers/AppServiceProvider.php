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



class AppServiceProvider extends ServiceProvider
{
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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
{
    Gate::policy(User::class, UserPolicy::class);
}
}