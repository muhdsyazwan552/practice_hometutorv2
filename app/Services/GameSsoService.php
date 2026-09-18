<?php

namespace App\Services;

use App\Models\GameSsoAuthorizationCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;
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
            'sub' => (string) $user->id,
            'name' => (string) $user->name,
            'email' => (string) $user->email,
            'role' => $record->role,
        ];
    }
}
