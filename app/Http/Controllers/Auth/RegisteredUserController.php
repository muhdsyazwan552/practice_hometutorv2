<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ParentWelcome;
use App\Models\User;
use App\Models\Company;
use App\Services\RegistrationOtpService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Step 1: validate the details, keep them in the session and email a
     * verification code. No account is created until the code is confirmed.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request, RegistrationOtpService $otp): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', Rules\Password::defaults()],
            'reference_code' => ['nullable', 'string', 'max:50'],
        ]);

        $referenceCode = strtoupper(trim((string) $request->input('reference_code')));
        $company = $referenceCode === ''
            ? Company::default()
            : Company::query()->where('reference_code', $referenceCode)->where('is_active', true)->first();

        if (! $company) {
            return back()->withErrors(['reference_code' => 'This reference code is not valid.'])->onlyInput('name', 'email', 'reference_code');
        }

        try {
            $otp->start([
                'name' => $request->name,
                'email' => $request->email,
                'password_hash' => Hash::make($request->password),
                'company_id' => $company->id,
                'reference_code' => $referenceCode ?: null,
            ]);
        } catch (\Throwable $exception) {
            $otp->cancel();
            Log::error('Registration OTP email could not be sent.', ['reason' => $exception->getMessage()]);

            return back()->withErrors(['email' => 'We could not send a verification code to this email. Please check it and try again.'])
                ->onlyInput('name', 'email', 'reference_code');
        }

        return redirect()->route('register.verify');
    }

    /**
     * Step 2: the "enter your code" screen.
     */
    public function showVerify(RegistrationOtpService $otp): Response|RedirectResponse
    {
        $pending = $otp->pending();

        if (! $pending) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/VerifyRegistration', [
            'email' => $this->maskEmail($pending['email']),
            'ttlMinutes' => RegistrationOtpService::TTL_MINUTES,
            'resendIn' => $otp->secondsUntilResend(),
            'status' => session('status'),
        ]);
    }

    /**
     * Step 2: confirm the code, then create the account and welcome the parent.
     */
    public function verify(Request $request, RegistrationOtpService $otp): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        $request->validate(['code' => ['required', 'digits:6']]);

        try {
            $details = $otp->verify($request->string('code')->toString());
        } catch (RuntimeException $exception) {
            if (! $otp->pending()) {
                return redirect()->route('login')->with('status', $exception->getMessage());
            }

            throw ValidationException::withMessages(['code' => $exception->getMessage()]);
        }

        // Someone may have registered this email while the code was in flight.
        if (User::query()->where('email', $details['email'])->exists()) {
            return redirect()->route('login')->with('status', 'This email is already registered. Please sign in.');
        }

        $user = User::create([
            'name' => $details['name'],
            'email' => $details['email'],
            'password' => $details['password_hash'],
            'display_name' => $details['name'],
            'role_id' => User::ROLE_PARENT,
            'is_active' => true,
            'company_id' => $details['company_id'],
            'registration_reference_code' => $details['reference_code'],
            'registered_at' => now(),
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();

        event(new Registered($user));

        try {
            Mail::to($user->email)->send(new ParentWelcome($user));
        } catch (\Throwable $exception) {
            // The account is already verified and created; a missing welcome
            // email must not block the parent from getting in.
            Log::warning('Parent welcome email could not be sent.', ['user_id' => $user->id, 'reason' => $exception->getMessage()]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return Inertia::location(route('parent.dashboard', absolute: false));
    }

    public function resend(RegistrationOtpService $otp): RedirectResponse
    {
        if (! $otp->pending()) {
            return redirect()->route('login');
        }

        if (($wait = $otp->secondsUntilResend()) > 0) {
            throw ValidationException::withMessages(['code' => "Please wait {$wait} seconds before requesting a new code."]);
        }

        try {
            $otp->send();
        } catch (RuntimeException $exception) {
            $otp->cancel();

            return redirect()->route('login')->with('status', $exception->getMessage());
        } catch (\Throwable $exception) {
            Log::error('Registration OTP resend failed.', ['reason' => $exception->getMessage()]);

            throw ValidationException::withMessages(['code' => 'We could not send a new code right now. Please try again shortly.']);
        }

        return back()->with('status', 'A new code has been sent to your email.');
    }

    public function cancel(RegistrationOtpService $otp): RedirectResponse
    {
        $otp->cancel();

        return redirect()->route('login');
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);

        return Str::mask($local, '*', min(2, strlen($local))).'@'.$domain;
    }
}
