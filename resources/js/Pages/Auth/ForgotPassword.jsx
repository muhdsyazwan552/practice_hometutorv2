import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthCardLayout from '@/Layouts/AuthCardLayout';
import { Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status, ttlMinutes = 30 }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthCardLayout
            title="Forgot Password"
            eyebrow="HomeTutor account"
            heading="Forgot your password?"
            intro={`Enter your email and we'll send you a temporary password. It works once, for ${ttlMinutes} minutes, and you'll choose a new password right after signing in.`}
        >
            {status && (
                <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="font-semibold text-slate-700">Email</label>
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-2 block w-full rounded-xl border-slate-200 py-3 focus:border-[#0788c9] focus:ring-[#0788c9]"
                        isFocused={true}
                        autoComplete="email"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <PrimaryButton disabled={processing} className="flex w-full justify-center rounded-xl bg-[#0788c9] py-3.5 text-sm font-bold hover:bg-[#056fa7] focus:bg-[#056fa7] active:bg-[#056fa7]">
                    {processing ? 'Sending…' : 'Email me a temporary password'}
                </PrimaryButton>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
                Remembered it? <Link href={route('login')} className="font-bold text-[#0788c9] hover:text-[#082c58]">Back to sign in</Link>
            </p>
        </AuthCardLayout>
    );
}
