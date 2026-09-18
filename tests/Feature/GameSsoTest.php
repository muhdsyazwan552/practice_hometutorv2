<?php

namespace Tests\Feature;

use App\Models\GameSsoAuthorizationCode;
use App\Models\User;
use App\Services\GameSsoService;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameSsoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.game_sso.games_url' => 'https://games.example.test',
            'services.game_sso.audience' => 'hometutor-games',
            'services.game_sso.client_id' => 'hometutor-games',
            'services.game_sso.client_secret' => 'test-shared-secret',
            'services.game_sso.code_ttl' => 60,
            'services.game_sso.allowed_roles' => ['child', 'parent', 'admin', 'code-manager', 'super-admin'],
        ]);
    }

    public function test_play_redirects_an_allowed_user_to_the_games_sso_login(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);

        $this->actingAs($child)->get('/games/play')
            ->assertRedirect('https://games.example.test/sso/authorize');
    }

    public function test_play_sends_a_disallowed_user_back_with_an_error(): void
    {
        $user = User::factory()->create(['role_id' => 999]);

        $this->actingAs($user)->from('/dashboard')->get('/games/play')
            ->assertRedirect('/dashboard')
            ->assertSessionHas('error');
    }

    public function test_play_requires_login(): void
    {
        $this->get('/games/play')->assertRedirect('/login');
    }

    public function test_authorize_issues_a_code_and_redirects_to_games_callback(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD, 'name' => 'Aiman Child']);

        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);

        $this->assertNotEmpty($code);
        $response->assertRedirect("https://games.example.test/sso/callback?code={$code}&state=abc123state");
        $this->assertDatabaseCount('game_sso_authorization_codes', 1);
    }

    public function test_authorize_stores_correct_hashes_role_audience_and_expiry(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);

        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);

        $record = GameSsoAuthorizationCode::firstOrFail();
        $this->assertSame(hash('sha256', $code), $record->code_hash);
        $this->assertSame(hash('sha256', 'abc123state'), $record->state_hash);
        $this->assertSame($child->id, $record->user_id);
        $this->assertSame('student', $record->role);
        $this->assertSame('hometutor-games', $record->audience);
        $this->assertNull($record->used_at);
        $this->assertEqualsWithDelta(now()->addSeconds(60)->timestamp, $record->expires_at->timestamp, 5);
    }

    public function test_authorize_rejects_a_role_not_in_allowed_roles(): void
    {
        $user = User::factory()->create(['role_id' => 999]);

        $this->actingAs($user)->get('/api/games/sso?state=abc123state')->assertForbidden();
        $this->assertDatabaseCount('game_sso_authorization_codes', 0);
    }

    public function test_exchange_returns_claims_and_marks_the_code_used(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD, 'name' => 'Aiman Child', 'email' => 'aiman@example.com']);
        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);

        $exchange = $this->postJson('/api/internal/game-sso/exchange', [
            'code' => $code,
            'state' => 'abc123state',
            'client_id' => 'hometutor-games',
            'client_secret' => 'test-shared-secret',
        ]);

        $exchange->assertOk()->assertJson([
            'data' => [
                'sub' => 'v2:'.$child->id,
                'name' => 'Aiman Child',
                'email' => 'aiman@example.com',
                'role' => 'student',
            ],
        ]);
        $this->assertNotNull(GameSsoAuthorizationCode::firstOrFail()->used_at);
    }

    public function test_exchange_rejects_wrong_client_secret(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);

        $this->postJson('/api/internal/game-sso/exchange', [
            'code' => $code,
            'state' => 'abc123state',
            'client_id' => 'hometutor-games',
            'client_secret' => 'wrong-secret',
        ])->assertStatus(401);
        $this->assertNull(GameSsoAuthorizationCode::firstOrFail()->used_at);
    }

    public function test_exchange_rejects_a_reused_code(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);
        $payload = ['code' => $code, 'state' => 'abc123state', 'client_id' => 'hometutor-games', 'client_secret' => 'test-shared-secret'];

        $this->postJson('/api/internal/game-sso/exchange', $payload)->assertOk();
        $this->postJson('/api/internal/game-sso/exchange', $payload)->assertStatus(422);
    }

    public function test_exchange_rejects_an_expired_code(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);
        GameSsoAuthorizationCode::firstOrFail()->update(['expires_at' => now()->subMinute()]);

        $this->postJson('/api/internal/game-sso/exchange', [
            'code' => $code,
            'state' => 'abc123state',
            'client_id' => 'hometutor-games',
            'client_secret' => 'test-shared-secret',
        ])->assertStatus(422);
    }

    public function test_exchange_rejects_a_mismatched_state(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $response = $this->actingAs($child)->get('/api/games/sso?state=abc123state');
        $code = $this->extractCodeFromRedirect($response);

        $this->postJson('/api/internal/game-sso/exchange', [
            'code' => $code,
            'state' => 'a-different-state',
            'client_id' => 'hometutor-games',
            'client_secret' => 'test-shared-secret',
        ])->assertStatus(422);
    }

    public function test_signed_games_logout_ends_the_matching_session(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);

        $this->actingAs($child)->get($this->signedLogoutUrl('v2:'.$child->id))
            ->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_games_logout_with_a_bad_signature_keeps_the_session(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);
        $url = '/games/sso/logout?'.http_build_query([
            'sub' => 'v2:'.$child->id,
            'expires' => now()->addMinute()->timestamp,
            'signature' => str_repeat('0', 64),
        ]);

        $this->actingAs($child)->get($url)->assertRedirect(route('login'));
        $this->assertAuthenticatedAs($child);
    }

    public function test_games_logout_for_another_subject_keeps_the_session(): void
    {
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);

        $this->actingAs($child)->get($this->signedLogoutUrl('v2:999999'));
        $this->assertAuthenticatedAs($child);
    }

    public function test_logging_out_here_tells_games_to_drop_the_session(): void
    {
        Http::fake(['games.example.test/*' => Http::response(null, 204)]);
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);

        $this->actingAs($child)->post('/logout')->assertRedirect('/login');

        Http::assertSent(function ($request) use ($child) {
            $sso = app(GameSsoService::class);

            return $request->url() === 'https://games.example.test/api/v1/sso/logout'
                && $request['sub'] === 'v2:'.$child->id
                && $sso->verifyLogoutSignature($request['sub'], $request['expires'], $request['signature']);
        });
    }

    public function test_logout_still_works_when_games_is_down(): void
    {
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('down'));
        $child = User::factory()->create(['role_id' => User::ROLE_CHILD]);

        $this->actingAs($child)->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    private function signedLogoutUrl(string $sub): string
    {
        $expires = now()->addMinute()->timestamp;

        return '/games/sso/logout?'.http_build_query([
            'sub' => $sub,
            'expires' => $expires,
            'signature' => app(GameSsoService::class)->logoutSignature($sub, $expires),
        ]);
    }

    private function extractCodeFromRedirect($response): string
    {
        $location = $response->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        return $query['code'];
    }

}
