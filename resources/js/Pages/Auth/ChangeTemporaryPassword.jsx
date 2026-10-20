import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthCardLayout from '@/Layouts/AuthCardLayout';
import { router, useForm } from '@inertiajs/react';
import useThemedAlert from '@/utils/useThemedAlert';

export default function ChangeTemporaryPassword({ name }) {
    const alert = useThemedAlert();
    const handleLogout = async () => {
        const result = await alert.confirm({ title: alert.tr('Sign out?', 'Log keluar?'), text: alert.tr('You can set your new password the next time you sign in.', 'Anda boleh menetapkan kata laluan baharu apabila log masuk semula.'), confirmText: alert.tr('Sign out', 'Log keluar'), icon: 'warning' });
        if (result.isConfirmed) router.post(route('logout'));
    };
    const { data, setData, put, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        put(route('password.temporary.update'), { onError: () => reset('password', 'password_confirmation') });
    };

    return (
        <AuthCardLayout
            title="Choose a new password"
            eyebrow="One more step"
            heading={`Hi ${name}, choose a new password`}
            intro="You signed in with a temporary password. Set your own password to continue."
        >
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="password" className="font-semibold text-slate-700">New password</label>
                    <TextInput id="password" type="password" name="password" value={data.password} autoComplete="new-password" isFocused
                        className="mt-2 block w-full rounded-xl border-slate-200 py-3 focus:border-[#0788c9] focus:ring-[#0788c9]"
                        onChange={(event) => setData('password', event.target.value)} required />
                    <InputError message={errors.password} className="mt-2" />
                </div>
                <div>
                    <label htmlFor="password_confirmation" className="font-semibold text-slate-700">Confirm new password</label>
                    <TextInput id="password_confirmation" type="password" name="password_confirmation" value={data.password_confirmation} autoComplete="new-password"
                        className="mt-2 block w-full rounded-xl border-slate-200 py-3 focus:border-[#0788c9] focus:ring-[#0788c9]"
                        onChange={(event) => setData('password_confirmation', event.target.value)} required />
                </div>

                <PrimaryButton disabled={processing} className="flex w-full justify-center rounded-xl bg-[#0788c9] py-3.5 text-sm font-bold hover:bg-[#056fa7] focus:bg-[#056fa7] active:bg-[#056fa7]">
                    {processing ? 'Saving…' : 'Save new password'}
                </PrimaryButton>
            </form>

            <button type="button" onClick={handleLogout} className="mt-6 w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700">
                {alert.tr('Sign out', 'Log keluar')}
            </button>
        </AuthCardLayout>
    );
}
