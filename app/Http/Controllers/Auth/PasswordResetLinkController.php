<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TemporaryPasswordService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the forgot-password view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'ttlMinutes' => TemporaryPasswordService::TTL_MINUTES,
        ]);
    }

    /**
     * Email a one-time temporary password. The reply is identical whether or
     * not the email is registered, so this can't be used to discover accounts.
     */
    public function store(Request $request, TemporaryPasswordService $temporaryPasswords): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::query()->where('email', strtolower(trim($request->string('email')->toString())))->first();

        if ($user && $user->is_active !== false) {
            try {
                $temporaryPasswords->issue($user);
            } catch (\Throwable $exception) {
                Log::error('Temporary password email could not be sent.', ['user_id' => $user->id, 'reason' => $exception->getMessage()]);
            }
        }

        return back()->with('status', 'If this email is registered, a temporary password has been sent to it. Check your inbox (and spam folder).');
    }
}
