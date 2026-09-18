<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\TemporaryPasswordService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * After signing in with an emailed temporary password the user must pick a
 * new password before doing anything else (see EnsureTemporaryPasswordChanged).
 */
class TemporaryPasswordChangeController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->get(TemporaryPasswordService::SESSION_FLAG)) {
            return redirect()->route($request->user()->homeRouteName());
        }

        return Inertia::render('Auth/ChangeTemporaryPassword', [
            'name' => $request->user()->name,
        ]);
    }

    public function update(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update(['password' => Hash::make($validated['password'])]);
        $request->session()->forget(TemporaryPasswordService::SESSION_FLAG);
        $request->session()->regenerate();

        // Parent pages are Blade, so leave the Inertia app with a full visit.
        return Inertia::location(route($request->user()->homeRouteName(), absolute: false));
    }
}
