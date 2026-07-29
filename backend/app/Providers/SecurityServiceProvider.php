<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class SecurityServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
    'security.risk.rules',
    fn () => [
        app(\App\Services\Security\Rules\BotRiskRule::class),
    ]
);

$this->app->singleton(
    \App\Services\Security\RiskEngineService::class,
    fn ($app) => new \App\Services\Security\RiskEngineService(
        $app->make('security.risk.rules')
    )
);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
