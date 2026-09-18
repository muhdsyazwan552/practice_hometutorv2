import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthCardLayout from '@/Layouts/AuthCardLayout';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function VerifyRegistration({ email, ttlMinutes, resendIn = 0, status }) {
    const { data, setData, post, processing, errors } = useForm({ code: '' });
    const [cooldown, setCooldown] = useState(resendIn);
    const [resending, setResending] = useState(false);

    useEffect(() => setCooldown(resendIn), [resendIn]);
    useEffect(() => {
        if (cooldown <= 0) return undefined;
        const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const submit = (event) => {
        event.preventDefault();
        post(route('register.verify.store'), { onError: () => setData('code', '') });
    };

    const resend = () => {
        setResending(true);
        router.post(route('register.verify.resend'), {}, { preserveScroll: true, onFinish: () => setResending(false) });
    };

    return (
        <AuthCardLayout
            title="Verify your email"
            eyebrow="Step 2 of 2"
            heading="Check your email"
            intro={<>We sent a 6-digit code to <strong className="text-slate-700">{email}</strong>. It expires in {ttlMinutes} minutes.</>}
        >
            {status && <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="code" className="font-semibold text-slate-700">Verification code</label>
                    <input
                        id="code"
                        name="code"
                        value={data.code}
                        onChange={(event) => setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        placeholder="••••••"
                        className="mt-2 block w-full rounded-xl border-slate-200 py-3.5 text-center text-2xl font-bold tracking-[0.6em] text-[#082c58] shadow-sm focus:border-[#0788c9] focus:ring-[#0788c9]"
                    />
                    <InputError message={errors.code} className="mt-2" />
                </div>

                <PrimaryButton disabled={processing || data.code.length !== 6} className="flex w-full justify-center rounded-xl bg-[#0788c9] py-3.5 text-sm font-bold hover:bg-[#056fa7] focus:bg-[#056fa7] active:bg-[#056fa7]">
                    {processing ? 'Verifying…' : 'Verify and create account'}
                </PrimaryButton>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
                <button type="button" onClick={resend} disabled={cooldown > 0 || resending} className="font-bold text-[#0788c9] hover:text-[#082c58] disabled:cursor-not-allowed disabled:text-slate-400">
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : resending ? 'Sending…' : 'Resend code'}
                </button>
                <button type="button" onClick={() => router.post(route('register.verify.cancel'))} className="font-medium text-slate-500 hover:text-slate-700">
                    Use a different email
                </button>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-400">Can't find it? Check your spam or promotions folder.</p>
        </AuthCardLayout>
    );
}
