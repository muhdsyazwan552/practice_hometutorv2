<?php

namespace Tests\Feature;

use App\Models\GameSsoAuthorizationCode;
use App\Models\User;
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
                'sub' => (string) $child->id,
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

    private function extractCodeFromRedirect($response): string
    {
        $location = $response->headers->get('Location');
        parse_str((string) parse_url($location, PHP_URL_QUERY), $query);

        return $query['code'];
    }

}
