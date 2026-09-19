<?php

namespace App\Providers;

use App\Models\Order;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Plain "throttle:N,1" shares one counter per user/IP across every
        // throttled route, so game SSO gets its own keys. The exchange is called
        // server-to-server by hometutor-games (one IP for every student), so it
        // is keyed by client and sized for a whole school logging in at once.
        RateLimiter::for('game-sso', fn (Request $request) => Limit::perMinute(30)
            ->by('game-sso|'.$request->route()?->getName().'|'.($request->user()?->id ?: $request->ip())));
        // Routes that send email (register OTP, resend, forgot password): cap per
        // address so nobody can flood a parent's inbox, and per IP overall.
        RateLimiter::for('auth-email', fn (Request $request) => [
            Limit::perMinutes(10, 5)->by('auth-email|'.$request->route()?->getName().'|'.strtolower((string) ($request->input('email') ?? $request->session()->get('pending_registration.email')))),
            Limit::perMinute(20)->by('auth-email-ip|'.$request->ip()),
        ]);
        RateLimiter::for('auth-otp', fn (Request $request) => Limit::perMinute(10)->by('auth-otp|'.$request->ip()));

        // Chat and friend actions: per student and per route, so chatting never
        // eats into the shared allowance of other throttled routes.
        RateLimiter::for('social', fn (Request $request) => Limit::perMinute(60)
            ->by('social|'.$request->route()?->uri().'|'.($request->user()?->id ?: $request->ip())));

        RateLimiter::for('game-sso-exchange', fn (Request $request) => Limit::perMinute(600)
            ->by('game-sso-exchange|'.(string) $request->input('client_id')));

        View::composer('layouts.parent', function ($view): void {
            $cartItemCount = 0;
            $parent = auth()->user();

            if ($parent?->isParent()) {
                $draft = Order::query()
                    ->where('parent_id', $parent->id)
                    ->where('status', Order::STATUS_DRAFT)
                    ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                    ->withCount(['items as cart_item_count' => fn ($query) => $query->where('fulfillment_status', 'pending')])
                    ->latest('id')
                    ->first();
                $cartItemCount = (int) ($draft?->cart_item_count ?? 0);
            }

            $view->with('cartItemCount', $cartItemCount);
        });
    }
}
