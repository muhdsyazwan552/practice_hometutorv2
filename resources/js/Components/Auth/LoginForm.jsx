import { Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ArrowRightIcon, CheckCircleIcon, LockClosedIcon, MapPinIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline';
import Checkbox from '@/Components/Checkbox';
import { useLanguage } from '@/Contexts/LanguageContext';
import { AuthField, AuthSubmit } from './AuthFields';

/**
 * Username/password sign-in shared by parents and children, with an optional one-time
 * location share. `role` only changes the wording and hints: both post the same fields.
 */
export default function LoginForm({ role, status, canResetPassword, onRegister }) {
    const { t } = useLanguage();
    const isStudent = role === 'student';
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationRequested, setLocationRequested] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        password: '',
        remember: false,
        location: null,
    });

    useEffect(() => {
        setLocationRequested(window.localStorage.getItem('hometutor-location-requested') === 'true');
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('unsupported');
            return;
        }

        setLocationStatus('requesting');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setData('location', {
                    latitude: Number(position.coords.latitude.toFixed(3)),
                    longitude: Number(position.coords.longitude.toFixed(3)),
                    accuracy: Math.round(position.coords.accuracy),
                });
                window.localStorage.setItem('hometutor-location-requested', 'true');
                setLocationRequested(true);
                setLocationStatus('shared');
            },
            () => {
                window.localStorage.setItem('hometutor-location-requested', 'true');
                setLocationRequested(true);
                setLocationStatus('unavailable');
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
        );
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            {status && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{status}</div>}
            <AuthField
                id="username"
                label={isStudent ? t('auth_page.username_student', 'Username') : t('auth_page.username_parent', 'Email or username')}
                placeholder={isStudent ? t('auth_page.username_student_placeholder', 'e.g. aisyah123') : undefined}
                icon={UserIcon}
                value={data.username}
                onChange={(v) => setData('username', v)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                error={errors.username}
            />
            <AuthField id="password" type="password" label={t('auth_page.password', 'Password')} icon={LockClosedIcon} value={data.password} onChange={(v) => setData('password', v)} autoComplete="current-password" required error={errors.password} />
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center text-sm font-medium text-slate-600">
                    <Checkbox name="remember" checked={data.remember} onChange={(event) => setData('remember', event.target.checked)} />
                    <span className="ml-2">{t('auth_page.remember', 'Remember me')}</span>
                </label>
                {!isStudent && canResetPassword && <Link href={route('password.request')} className="text-sm font-semibold text-blue-600 hover:text-blue-800">{t('auth_page.forgot', 'Forgot password?')}</Link>}
            </div>
            {isStudent && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">{t('auth_page.student_forgot', 'Forgot your password? Ask your parent for help.')}</p>
            )}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                {locationStatus === 'shared' ? (
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircleIcon className="h-4 w-4" /> {t('auth_page.location_shared', 'Approximate location shared for this sign-in.')}</p>
                ) : locationRequested ? (
                    <p className="text-xs leading-5 text-slate-500">{t('auth_page.location_already', 'Location permission was already requested on this device. You can still sign in safely without it.')}</p>
                ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="max-w-[240px] text-xs leading-5 text-slate-500">{t('auth_page.location_optional', 'Optional: share your approximate location once to help protect your account.')}</p>
                        <button type="button" onClick={requestLocation} disabled={locationStatus === 'requesting'} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-blue-50 disabled:cursor-wait">
                            <MapPinIcon className="h-4 w-4" />{locationStatus === 'requesting' ? t('auth_page.location_requesting', 'Requesting…') : t('auth_page.location_share_once', 'Share once')}
                        </button>
                    </div>
                )}
                {locationStatus === 'unsupported' && <p className="mt-2 text-xs font-medium text-amber-700">{t('auth_page.location_unsupported', 'This browser does not support location sharing.')}</p>}
                {locationStatus === 'unavailable' && <p className="mt-2 text-xs font-medium text-slate-500">{t('auth_page.location_unavailable', 'Location was not shared. You can continue signing in.')}</p>}
            </div>
            <AuthSubmit disabled={processing} className={isStudent ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:brightness-110' : undefined}>
                {processing
                    ? t('auth_page.signing_in', 'Signing in…')
                    : isStudent ? t('auth_page.submit_student', "Let's start learning") : t('auth_page.submit_parent', 'Sign in')}
                {isStudent ? <SparklesIcon className="h-5 w-5" /> : <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />}
            </AuthSubmit>
            {!isStudent && (
                <p className="pt-1 text-center text-sm text-slate-500">
                    {t('auth_page.new_parent', 'New parent?')} <button type="button" onClick={onRegister} className="font-semibold text-blue-600 hover:text-blue-800">{t('auth_page.create_account', 'Create an account')}</button>
                </p>
            )}
        </form>
    );
}
