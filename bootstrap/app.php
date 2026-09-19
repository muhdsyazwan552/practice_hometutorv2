<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule) {
        // Requires a real server cron entry running `php artisan schedule:run`
        // every minute — see the Quiz Arena plan notes for local testing via
        // `php artisan quiz-arena:settle` directly.
        $schedule->command('quiz-arena:settle')->sundays()->at('23:59');
    })
    ->withMiddleware(function (Middleware $middleware) {

        // 🌍 Global
        $middleware->append([
            // \App\Http\Middleware\TrustProxies::class,
            \Illuminate\Http\Middleware\HandleCors::class,
            // \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
            \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
            // \App\Http\Middleware\TrimStrings::class,
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        // 📦 Web group
        $middleware->group('web', [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\EnsureTemporaryPasswordChanged::class,
        ]);

        // 🛣 Alias
        $middleware->alias([
            // 'auth' => \App\Http\Middleware\Authenticate::class,
            // 'localize' => \App\Http\Middleware\Localization::class,
            'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'subscribed' => \App\Http\Middleware\EnsureActiveSubscription::class,
            'child.subscribed' => \App\Http\Middleware\EnsureChildHasActiveSubscription::class,
            'integration.jwt' => \App\Http\Middleware\AuthenticateIntegrationJwt::class,
        ]);
    })

    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
