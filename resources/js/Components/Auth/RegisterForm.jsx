import { useForm } from '@inertiajs/react';
import { ArrowRightIcon, EnvelopeIcon, LockClosedIcon, TicketIcon, UserIcon } from '@heroicons/react/24/outline';
import InputError from '@/Components/InputError';
import { useLanguage } from '@/Contexts/LanguageContext';
import { AuthField, AuthSubmit } from './AuthFields';

/** Parent sign-up: name, email, password and an optional reference code; a 6-digit code is emailed next. */
export default function RegisterForm() {
    const { t } = useLanguage();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        reference_code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <AuthField id="name" label={t('auth_page.name', "Parent's full name")} icon={UserIcon} value={data.name} onChange={(v) => setData('name', v)} autoComplete="name" required error={errors.name} />
            <AuthField id="email" type="email" label={t('auth_page.email', 'Email')} icon={EnvelopeIcon} value={data.email} onChange={(v) => setData('email', v)} autoComplete="username" required error={errors.email} />
            <AuthField id="password" type="password" label={t('auth_page.password', 'Password')} icon={LockClosedIcon} value={data.password} onChange={(v) => setData('password', v)} autoComplete="new-password" required error={errors.password} />
            <div>
                <AuthField id="reference_code" label={t('auth_page.reference', 'Reference code (optional)')} icon={TicketIcon} value={data.reference_code} onChange={(v) => setData('reference_code', v.toUpperCase())} autoComplete="off" inputClassName="uppercase" />
                <InputError message={errors.reference_code} className="mt-2" />
            </div>
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">{t('auth_page.code_note', "We'll email you a 6-digit code to confirm your address.")}</p>
            <AuthSubmit disabled={processing}>
                {processing ? t('auth_page.sending_code', 'Sending code…') : t('auth_page.register_submit', 'Create parent account')}
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
            </AuthSubmit>
        </form>
    );
}
