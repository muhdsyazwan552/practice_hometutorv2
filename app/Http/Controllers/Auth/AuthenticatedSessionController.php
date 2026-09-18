<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\GameSsoService;
use App\Services\LoginActivityService;
use App\Services\StreakService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        $request->authenticate();

        $request->session()->regenerate();
        app(StreakService::class)->recordLogin($request->user()->id);
        app(LoginActivityService::class)->record($request->user()->id, $request);

        if ($request->user()->isParent() || $request->user()->hasRole('admin') || $request->user()->isCodeManager()) {
            $request->session()->forget('url.intended');

            return Inertia::location(route($request->user()->homeRouteName(), absolute: false));
        }

        return redirect()->intended(route($request->user()->homeRouteName(), absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request, GameSsoService $gameSso): RedirectResponse
    {
        $user = $request->user();

        if ($user && $gameSso->resolveRole($user)) {
            $gameSso->notifyGamesLogout($user);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
