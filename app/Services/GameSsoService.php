<?php

namespace App\Services;

use App\Models\GameSsoAuthorizationCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Issues and redeems short-lived, single-use SSO authorization codes that let
 * an already-authenticated hometutorV2 user be signed into hometutor-games
 * without re-entering credentials there. Mirrors the authorization-code
 * pattern hometutor-games' SsoCodeExchangeService already expects.
 */
class GameSsoService
{
    private const ROLE_MAP = [
        'child' => 'student',
        'admin' => 'admin',
        'super-admin' => 'admin',
    ];

    /**
     * The games-side role string for this user, or null if their hometutorV2
     * role isn't in GAME_SSO_ALLOWED_ROLES.
     */
    public function resolveRole(User $user): ?string
    {
        $allowedRoles = (array) config('services.game_sso.allowed_roles', []);
        $matchedRole = collect($allowedRoles)->first(fn (string $role) => $user->hasRole($role));

        return $matchedRole ? (self::ROLE_MAP[$matchedRole] ?? $matchedRole) : null;
    }

    public function issueCode(User $user, string $state, string $role): string
    {
        $code = bin2hex(random_bytes(32));

        GameSsoAuthorizationCode::create([
            'code_hash' => hash('sha256', $code),
            'state_hash' => hash('sha256', $state),
            'user_id' => $user->id,
            'role' => $role,
            'audience' => (string) config('services.game_sso.audience'),
            'expires_at' => now()->addSeconds((int) config('services.game_sso.code_ttl', 60)),
        ]);

        return $code;
    }

    /**
     * Games stores this as users.sso_subject; existing linked accounts use the
     * "v2:<id>" form, so changing it would orphan their progress.
     */
    public function subjectFor(User $user): string
    {
        return 'v2:'.$user->id;
    }

    /**
     * Logout messages in both directions are signed with the shared client
     * secret so a third-party page can't force a student to log out.
     */
    public function logoutSignature(string $sub, int $expires): string
    {
        return hash_hmac('sha256', "logout|{$sub}|{$expires}", (string) config('services.game_sso.client_secret'));
    }

    public function verifyLogoutSignature(string $sub, int $expires, string $signature): bool
    {
        return (string) config('services.game_sso.client_secret') !== ''
            && $expires >= now()->timestamp
            && $expires <= now()->addMinutes(5)->timestamp
            && hash_equals($this->logoutSignature($sub, $expires), $signature);
    }

    /**
     * Back-channel logout: ask hometutor-games to drop this user's sessions so
     * logging out here also logs them out there. Best-effort — a games outage
     * must never block logging out of hometutorV2.
     */
    public function notifyGamesLogout(User $user): void
    {
        $gamesUrl = (string) config('services.game_sso.games_url');

        if ($gamesUrl === '' || (string) config('services.game_sso.client_secret') === '') {
            return;
        }

        $sub = $this->subjectFor($user);
        $expires = now()->addMinute()->timestamp;

        try {
            Http::acceptJson()->timeout(3)->post($gamesUrl.'/api/v1/sso/logout', [
                'sub' => $sub,
                'expires' => $expires,
                'signature' => $this->logoutSignature($sub, $expires),
            ]);
        } catch (\Throwable $exception) {
            Log::warning('Game SSO back-channel logout failed.', ['reason' => $exception->getMessage()]);
        }
    }

    public function verifyClient(string $clientId, string $clientSecret): bool
    {
        return hash_equals((string) config('services.game_sso.client_id'), $clientId)
            && hash_equals((string) config('services.game_sso.client_secret'), $clientSecret);
    }

    /**
     * @return array{sub: string, name: string, email: string, role: string}
     */
    public function exchangeCode(string $code, string $state): array
    {
        $record = DB::transaction(function () use ($code, $state): GameSsoAuthorizationCode {
            $record = GameSsoAuthorizationCode::query()
                ->where('code_hash', hash('sha256', $code))
                ->lockForUpdate()
                ->first();

            if (! $record
                || $record->used_at !== null
                || $record->expires_at->isPast()
                || ! hash_equals($record->state_hash, hash('sha256', $state))) {
                throw new RuntimeException('Invalid or expired authorization code.');
            }

            $record->update(['used_at' => now()]);

            return $record;
        });

        $user = $record->user;

        if (! $user) {
            throw new RuntimeException('The account for this code no longer exists.');
        }

        return [
            'sub' => $this->subjectFor($user),
            'name' => (string) $user->name,
            'email' => (string) $user->email,
            'role' => $record->role,
        ];
    }
}
