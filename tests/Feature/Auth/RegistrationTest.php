<?php

namespace Tests\Feature\Auth;

use App\Mail\ParentWelcome;
use App\Mail\RegistrationOtp;
use App\Models\Company;
use App\Models\User;
use App\Services\RegistrationOtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')->assertStatus(200);
    }

    public function test_submitting_details_emails_a_code_without_creating_the_account(): void
    {
        $this->post('/register', $this->details())->assertRedirect(route('register.verify'));

        Mail::assertSent(RegistrationOtp::class, fn (RegistrationOtp $mail) => $mail->hasTo('test@example.com')
            && preg_match('/^\d{6}$/', $mail->code));
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
        $this->assertGuest();
        $this->get(route('register.verify'))->assertOk();
    }

    public function test_correct_code_creates_a_verified_parent_and_sends_welcome_email(): void
    {
        $this->post('/register', $this->details());

        $response = $this->post(route('register.verify.store'), ['code' => $this->sentCode()]);

        $response->assertRedirect(route('parent.dashboard', absolute: false));
        $this->assertAuthenticated();
        $user = User::where('email', 'test@example.com')->firstOrFail();
        $this->assertSame(User::ROLE_PARENT, $user->role_id);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame(Company::query()->where('name', 'Dasar Jati')->value('id'), $user->company_id);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $user->password));
        Mail::assertSent(ParentWelcome::class, fn (ParentWelcome $mail) => $mail->hasTo('test@example.com'));
    }

    public function test_wrong_code_is_rejected_and_counts_attempts(): void
    {
        $this->post('/register', $this->details());
        $wrong = $this->sentCode() === '000000' ? '111111' : '000000';

        $this->post(route('register.verify.store'), ['code' => $wrong])->assertSessionHasErrors('code');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
        $this->assertSame(1, session(RegistrationOtpService::SESSION_KEY)['attempts']);
    }

    public function test_code_stops_working_after_too_many_wrong_attempts(): void
    {
        $this->post('/register', $this->details());
        $code = $this->sentCode();
        $wrong = $code === '000000' ? '111111' : '000000';

        foreach (range(1, RegistrationOtpService::MAX_ATTEMPTS) as $_) {
            $this->post(route('register.verify.store'), ['code' => $wrong]);
        }

        $this->post(route('register.verify.store'), ['code' => $code])->assertSessionHasErrors('code');
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
    }

    public function test_expired_code_is_rejected(): void
    {
        $this->post('/register', $this->details());
        $code = $this->sentCode();

        $this->travel(RegistrationOtpService::TTL_MINUTES + 1)->minutes();

        $this->post(route('register.verify.store'), ['code' => $code])->assertSessionHasErrors('code');
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
    }

    public function test_resend_waits_for_the_cooldown_then_sends_a_new_code(): void
    {
        $this->post('/register', $this->details());
        $first = $this->sentCode();

        $this->post(route('register.verify.resend'))->assertSessionHasErrors('code');
        Mail::assertSentCount(1);

        $this->travel(RegistrationOtpService::RESEND_COOLDOWN_SECONDS + 1)->seconds();
        $this->post(route('register.verify.resend'))->assertSessionHasNoErrors();
        Mail::assertSentCount(2);

        $second = Mail::sent(RegistrationOtp::class)->last()->code;
        if ($second !== $first) {
            $this->post(route('register.verify.store'), ['code' => $first])->assertSessionHasErrors('code');
        }
        $this->post(route('register.verify.store'), ['code' => $second]);
        $this->assertAuthenticated();
    }

    public function test_verify_screen_without_a_pending_registration_goes_to_login(): void
    {
        $this->get(route('register.verify'))->assertRedirect(route('login'));
    }

    public function test_reference_code_attributes_registration_to_its_company(): void
    {
        $this->post('/register', [...$this->details(), 'email' => 'explode@example.com', 'reference_code' => 'explode']);
        $this->post(route('register.verify.store'), ['code' => $this->sentCode()]);

        $this->assertDatabaseHas('users', [
            'email' => 'explode@example.com',
            'company_id' => Company::query()->where('name', 'Explode')->value('id'),
            'registration_reference_code' => 'EXPLODE',
        ]);
    }

    public function test_invalid_reference_code_cannot_be_used(): void
    {
        $response = $this->from('/register')->post('/register', [...$this->details(), 'reference_code' => 'INVALID']);

        $response->assertRedirect('/register')->assertSessionHasErrors('reference_code');
        Mail::assertNothingSent();
        $this->assertGuest();
    }

    public function test_already_registered_email_is_rejected_before_sending_a_code(): void
    {
        User::factory()->create(['email' => 'test@example.com']);

        $this->from('/register')->post('/register', $this->details())->assertSessionHasErrors('email');
        Mail::assertNothingSent();
    }

    private function details(): array
    {
        return [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ];
    }

    private function sentCode(): string
    {
        return Mail::sent(RegistrationOtp::class)->last()->code;
    }
}
