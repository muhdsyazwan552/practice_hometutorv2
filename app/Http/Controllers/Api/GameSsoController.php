<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GameSsoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GameSsoController extends Controller
{
    /**
     * "HomeTutor Play" button target: checks access here first, then hands the
     * browser to hometutor-games, which starts the SSO round-trip (it creates
     * the state and bounces back to authorize() below).
     */
    public function play(Request $request, GameSsoService $sso): RedirectResponse
    {
        $gamesUrl = (string) config('services.game_sso.games_url');

        if ($gamesUrl === '' || ! $sso->resolveRole($request->user())) {
            return back()->with('error', 'HomeTutor Play is not available for this account.');
        }

        return redirect()->away($gamesUrl.'/sso/authorize');
    }

    /**
     * Front-channel single logout: a student who logs out of hometutor-games is
     * sent here (games has already dropped its own session) so we end this
     * session too and land them on our login page. Only a URL signed by games
     * is honoured, so other sites can't log students out.
     */
    public function logout(Request $request, GameSsoService $sso): RedirectResponse
    {
        $validated = $request->validate([
            'sub' => ['required', 'string', 'max:64'],
            'expires' => ['required', 'integer'],
            'signature' => ['required', 'string', 'size:64'],
        ]);

        if (! $sso->verifyLogoutSignature($validated['sub'], (int) $validated['expires'], $validated['signature'])) {
            return redirect()->route('login');
        }

        $user = $request->user();

        if ($user && $sso->subjectFor($user) === $validated['sub']) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('login');
    }

    public function authorize(Request $request, GameSsoService $sso): RedirectResponse
    {
        $validated = $request->validate([
            'state' => ['required', 'string', 'max:255'],
        ]);

        $gamesUrl = (string) config('services.game_sso.games_url');
        abort_if($gamesUrl === '', 500, 'The games platform is not configured.');

        $role = $sso->resolveRole($request->user());
        abort_if(! $role, 403, 'This account cannot access the games platform.');

        $code = $sso->issueCode($request->user(), $validated['state'], $role);

        return redirect()->away($gamesUrl.'/sso/callback?'.http_build_query([
            'code' => $code,
            'state' => $validated['state'],
        ]));
    }

    public function exchange(Request $request, GameSsoService $sso): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'client_id' => ['required', 'string', 'max:255'],
            'client_secret' => ['required', 'string', 'max:255'],
        ]);

        if (! $sso->verifyClient($validated['client_id'], $validated['client_secret'])) {
            return response()->json(['message' => 'Invalid client credentials.'], 401);
        }

        try {
            $claims = $sso->exchangeCode($validated['code'], $validated['state']);
        } catch (\Throwable $exception) {
            Log::info('Game SSO exchange rejected.', ['reason' => $exception->getMessage()]);

            return response()->json(['message' => 'Invalid or expired authorization code.'], 422);
        }

        return response()->json(['data' => $claims]);
    }
}
