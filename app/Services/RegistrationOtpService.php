<?php

namespace App\Services;

use App\Mail\RegistrationOtp;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

/**
 * Holds a parent's registration details in their session until they prove the
 * email is theirs with a 6-digit code. No user row exists before that, so a
 * mistyped or someone-else's email never becomes an account.
 */
class RegistrationOtpService
{
    public const SESSION_KEY = 'pending_registration';

    public const TTL_MINUTES = 10;

    public const MAX_ATTEMPTS = 5;

    public const MAX_SENDS = 5;

    public const RESEND_COOLDOWN_SECONDS = 60;

    public function __construct(private Session $session) {}

    /**
     * @param  array{name: string, email: string, password_hash: string, company_id: int, reference_code: ?string}  $details
     */
    public function start(array $details): void
    {
        $this->session->put(self::SESSION_KEY, [...$details, 'sends' => 0]);
        $this->send();
    }

    public function pending(): ?array
    {
        $pending = $this->session->get(self::SESSION_KEY);

        return is_array($pending) ? $pending : null;
    }

    public function secondsUntilResend(): int
    {
        $sentAt = $this->pending()['sent_at'] ?? 0;

        return max(0, $sentAt + self::RESEND_COOLDOWN_SECONDS - now()->timestamp);
    }

    /**
     * Sends a fresh code (invalidating the previous one).
     *
     * @throws RuntimeException when there is nothing pending or the resend limit is hit
     */
    public function send(): void
    {
        $pending = $this->pending() ?? throw new RuntimeException('No registration is waiting for verification.');

        if ($pending['sends'] >= self::MAX_SENDS) {
            throw new RuntimeException('Too many codes requested. Please start the registration again.');
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->session->put(self::SESSION_KEY, [
            ...$pending,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(self::TTL_MINUTES)->timestamp,
            'attempts' => 0,
            'sends' => $pending['sends'] + 1,
            'sent_at' => now()->timestamp,
        ]);

        Mail::to($pending['email'])->send(new RegistrationOtp($pending['name'], $code, self::TTL_MINUTES));
    }

    /**
     * Returns the verified registration details and clears them from the
     * session, or throws with a message suitable to show the parent.
     *
     * @throws RuntimeException
     */
    public function verify(string $code): array
    {
        $pending = $this->pending() ?? throw new RuntimeException('Your registration session has expired. Please register again.');

        if (($pending['expires_at'] ?? 0) < now()->timestamp) {
            throw new RuntimeException('This code has expired. Request a new code.');
        }

        if ($pending['attempts'] >= self::MAX_ATTEMPTS) {
            throw new RuntimeException('Too many incorrect attempts. Request a new code.');
        }

        if (! Hash::check($code, $pending['code_hash'])) {
            $this->session->put(self::SESSION_KEY, [...$pending, 'attempts' => $pending['attempts'] + 1]);
            $left = self::MAX_ATTEMPTS - $pending['attempts'] - 1;

            throw new RuntimeException($left > 0
                ? "Incorrect code. {$left} attempt(s) left."
                : 'Too many incorrect attempts. Request a new code.');
        }

        $this->session->forget(self::SESSION_KEY);

        return $pending;
    }

    public function cancel(): void
    {
        $this->session->forget(self::SESSION_KEY);
    }
}
