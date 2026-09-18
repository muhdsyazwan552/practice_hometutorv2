<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GameSsoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GameSsoController extends Controller
{
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

        // TEMPORARY diagnostic logging while tracking down a live exchange
        // failure reported by hometutor-games — remove once resolved.
        Log::info('Game SSO exchange attempt received.', [
            'code_hash' => hash('sha256', $validated['code']),
            'state_hash' => hash('sha256', $validated['state']),
            'client_id_received' => $validated['client_id'],
            'client_id_matches' => hash_equals((string) config('services.game_sso.client_id'), $validated['client_id']),
            'client_secret_matches' => hash_equals((string) config('services.game_sso.client_secret'), $validated['client_secret']),
            'matching_row_exists' => \App\Models\GameSsoAuthorizationCode::where('code_hash', hash('sha256', $validated['code']))->exists(),
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
