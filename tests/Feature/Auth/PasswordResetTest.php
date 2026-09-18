<?php

namespace Tests\Feature\Auth;

use App\Mail\TemporaryPasswordIssued;
use App\Models\User;
use App\Services\TemporaryPasswordService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    public function test_forgot_password_screen_can_be_rendered(): void
    {
        $this->get('/forgot-password')->assertStatus(200);
    }

    public function test_temporary_password_matches_the_required_format(): void
    {
        $service = app(TemporaryPasswordService::class);

        foreach (range(1, 200) as $_) {
            // Capitalised word, two different symbols, then 2–3 digits — e.g. Kereta&$001, Kucing#@07.
            $password = $service->generate();
            $this->assertMatchesRegularExpression('/^[A-Z][a-z]+([!@#$%&*?])(?!\1)[!@#$%&*?]\d{2,3}$/', $password);
        }
    }

    public function test_requesting_emails_a_temporary_password_and_keeps_the_old_one(): void
    {
        $user = User::factory()->create(['password' => Hash::make('old-password')]);

        $this->post('/forgot-password', ['email' => $user->email])->assertSessionHas('status');

        Mail::assertSent(TemporaryPasswordIssued::class, fn ($mail) => $mail->hasTo($user->email));
        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_unknown_email_gets_the_same_reply_and_nothing_is_sent(): void
    {
        $this->post('/forgot-password', ['email' => 'nobody@example.com'])->assertSessionHas('status');

        Mail::assertNothingSent();
    }

    public function test_temporary_password_signs_in_once_and_forces_a_new_password(): void
    {
        $user = User::factory()->create(['email' => 'parent@example.com', 'role_id' => User::ROLE_PARENT]);
        $this->post('/forgot-password', ['email' => $user->email]);
        $temporary = $this->sentTemporaryPassword();

        $this->post('/login', ['username' => 'parent@example.com', 'password' => $temporary]);

        $this->assertAuthenticatedAs($user);
        $this->get(route('parent.dashboard'))->assertRedirect(route('password.temporary.show'));
        $this->get(route('password.temporary.show'))->assertOk();

        // Single use: it no longer works after being used.
        $this->post('/logout');
        $this->post('/login', ['username' => 'parent@example.com', 'password' => $temporary])->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_choosing_a_new_password_unlocks_the_account(): void
    {
        $user = User::factory()->create(['email' => 'parent@example.com', 'role_id' => User::ROLE_PARENT]);
        $this->post('/forgot-password', ['email' => $user->email]);
        $this->post('/login', ['username' => 'parent@example.com', 'password' => $this->sentTemporaryPassword()]);

        $this->put(route('password.temporary.update'), [
            'password' => 'Brand-new-Pass1',
            'password_confirmation' => 'Brand-new-Pass1',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('Brand-new-Pass1', $user->fresh()->password));
        $this->assertNull(session(TemporaryPasswordService::SESSION_FLAG));
        $this->get(route('password.temporary.show'))->assertRedirect();
    }

    public function test_temporary_password_expires(): void
    {
        $user = User::factory()->create(['email' => 'parent@example.com', 'role_id' => User::ROLE_PARENT]);
        $this->post('/forgot-password', ['email' => $user->email]);
        $temporary = $this->sentTemporaryPassword();

        $this->travel(TemporaryPasswordService::TTL_MINUTES + 1)->minutes();

        $this->post('/login', ['username' => 'parent@example.com', 'password' => $temporary])->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_signing_in_with_the_real_password_cancels_the_temporary_one(): void
    {
        $user = User::factory()->create(['email' => 'parent@example.com', 'role_id' => User::ROLE_PARENT, 'password' => Hash::make('old-password')]);
        $this->post('/forgot-password', ['email' => $user->email]);
        $temporary = $this->sentTemporaryPassword();

        $this->post('/login', ['username' => 'parent@example.com', 'password' => 'old-password']);
        $this->assertAuthenticatedAs($user);
        $this->assertNull(session(TemporaryPasswordService::SESSION_FLAG));
        $this->post('/logout');

        $this->post('/login', ['username' => 'parent@example.com', 'password' => $temporary])->assertSessionHasErrors('username');
    }

    private function sentTemporaryPassword(): string
    {
        return Mail::sent(TemporaryPasswordIssued::class)->last()->temporaryPassword;
    }
}
