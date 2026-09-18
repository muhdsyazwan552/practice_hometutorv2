<?php

namespace App\Http\Middleware;

use App\Services\TemporaryPasswordService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Someone signed in with a temporary password may only choose a new password
 * or log out until they have done so.
 */
class EnsureTemporaryPasswordChanged
{
    private const ALLOWED_ROUTES = ['password.temporary.show', 'password.temporary.update', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->hasSession()
            && $request->session()->get(TemporaryPasswordService::SESSION_FLAG)
            && $request->user()
            && ! $request->routeIs(...self::ALLOWED_ROUTES)) {
            return redirect()->route('password.temporary.show');
        }

        return $next($request);
    }
}
