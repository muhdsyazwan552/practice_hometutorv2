/*
 * Log in / register page, in the landing page's light theme and friendly to both
 * students and parents.
 *
 *  - Log in: "Who is signing in?" picks student or parent. It only changes the wording,
 *    hints and story (both post the same fields); the choice is remembered on the device.
 *  - Register: parents only. Students see a note that their parent creates their login,
 *    with a shortcut back to student sign-in.
 *  - Backgrounds: Vanta NET (log in, "connected") and WAVES (register, "start the
 *    journey"), both in pale tints so the dark text stays easy to read.
 *  - EN / BM switch in the header uses the app's language setting.
 * Switching tabs updates the URL (/login or /register) so a refresh keeps the same tab.
 */
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { AcademicCapIcon, ArrowLeftIcon, CheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';
import { ease, GridPattern } from '@/Components/PracticeLanding/Effects';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import '../../../css/practice-landing.css';

const VantaNet = lazy(() => import('@/Components/GameLanding/VantaNet'));
const VantaWaves = lazy(() => import('@/Components/PracticeLanding/VantaWaves'));

const BG = '#f5f8ff';
const img = (name) => `/images/landing-practice/${name}.webp`;
const ROLE_KEY = 'hometutor-login-role';

function readRole() {
    try {
        return window.localStorage.getItem(ROLE_KEY) === 'parent' ? 'parent' : 'student';
    } catch {
        return 'student';
    }
}

function Background({ mode }) {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0">
            <AnimatePresence initial={false}>
                <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="absolute inset-0">
                    <Suspense fallback={null}>
                        {mode === 'login'
                            ? <VantaNet className="h-full w-full" color={0x2563eb} backgroundColor={0xf5f8ff} />
                            : <VantaWaves className="h-full w-full" color={0xb4c8ff} fallback={BG} ambientBoost={Math.PI} />}
                    </Suspense>
                    <div className="pl-rainbow-tint" />
                </motion.div>
            </AnimatePresence>
            {/* Soften behind the story text; keep the effect visible around the card. */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/70 via-white/20 to-transparent" />
            <GridPattern className="opacity-70" />
        </div>
    );
}

function Story({ storyKey }) {
    const { t } = useLanguage();
    const k = (name, fallback) => t(`auth_page.story_${storyKey}_${name}`, fallback);
    const numbered = storyKey === 'register';
    const points = [k('p1', ''), k('p2', ''), k('p3', '')];

    return (
        <AnimatePresence mode="wait">
            <motion.div key={storyKey} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease }} className="relative">
                {storyKey === 'student' && (
                    <motion.img
                        src={img('robo')}
                        alt=""
                        animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        className="mb-4 w-24 drop-shadow-[0_16px_24px_rgba(37,99,235,.25)] sm:w-32 lg:w-40"
                    />
                )}
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">{k('eyebrow', '')}</p>
                <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl lg:text-6xl">
                    {k('title', '')} <span className="text-spectrum">{k('highlight', '')}</span>
                </h1>
                <p className="mt-5 hidden max-w-lg text-lg leading-relaxed text-slate-600 sm:block">{k('text', '')}</p>
                <ul className="mt-8 hidden space-y-3 lg:block">
                    {points.map((p, i) => (
                        <motion.li key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease }} className="flex items-center gap-3 text-base font-medium text-slate-700">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 ring-1 ring-blue-100">
                                {numbered ? i + 1 : <CheckIcon className="h-4 w-4" />}
                            </span>
                            {p}
                        </motion.li>
                    ))}
                </ul>
            </motion.div>
        </AnimatePresence>
    );
}

/** Two big, friendly buttons: children tap "I'm a student", parents tap "I'm a parent". */
function RolePicker({ role, onChange }) {
    const { t } = useLanguage();
    const roles = [
        ['student', AcademicCapIcon, t('auth_page.role_student', "I'm a student"), t('auth_page.role_student_hint', 'Use the login from your parent'), 'text-blue-600 bg-blue-50', 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-100'],
        ['parent', UserGroupIcon, t('auth_page.role_parent', "I'm a parent"), t('auth_page.role_parent_hint', "Manage your children's learning"), 'text-violet-600 bg-violet-50', 'border-violet-500 bg-violet-50/60 ring-4 ring-violet-100'],
    ];
    return (
        <fieldset>
            <legend className="text-sm font-semibold text-slate-700">{t('auth_page.who_title', 'Who is signing in?')}</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
                {roles.map(([key, Icon, label, hint, iconTone, activeTone]) => (
                    <button
                        key={key}
                        type="button"
                        aria-pressed={role === key}
                        onClick={() => onChange(key)}
                        className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition sm:p-4 ${role === key ? activeTone : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconTone}`}><Icon className="h-6 w-6" /></span>
                        <span className="font-display text-base font-bold leading-tight text-slate-900">{label}</span>
                        <span className="text-xs leading-snug text-slate-500">{hint}</span>
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

function LanguageSwitch() {
    const { locale, changeLanguage, isChangingLanguage } = useLanguage();
    return (
        <div role="group" aria-label="Language" className="flex rounded-full border border-slate-200 bg-white/90 p-0.5 text-sm font-semibold shadow-sm backdrop-blur">
            {[['en', 'EN'], ['ms', 'BM']].map(([code, label]) => (
                <button
                    key={code}
                    type="button"
                    disabled={isChangingLanguage}
                    aria-pressed={locale === code}
                    onClick={() => changeLanguage(code)}
                    className={`rounded-full px-3 py-1.5 transition ${locale === code ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

export default function AuthShell({ initialMode = 'login', status, canResetPassword }) {
    const { t } = useLanguage();
    const [mode, setMode] = useState(initialMode);
    const [role, setRole] = useState('student');
    const isLogin = mode === 'login';
    const isStudent = role === 'student';

    useEffect(() => { setRole(readRole()); }, []);
    const chooseRole = (next) => {
        setRole(next);
        try { window.localStorage.setItem(ROLE_KEY, next); } catch { /* per-device nicety only */ }
    };

    // Relative path: an absolute route() URL uses APP_URL, which may not match the visitor's host.
    useEffect(() => {
        const path = route(mode, undefined, false);
        if (window.location.pathname === path) return;
        try {
            window.history.replaceState(window.history.state, '', path);
        } catch {
            // Only a nicety; the tab still works if the address can't be updated.
        }
    }, [mode]);

    const storyKey = isLogin ? role : 'register';

    return (
        <>
            <Head title={isLogin ? t('auth_page.page_login', 'Log in') : t('auth_page.page_register', 'Create an account')}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:500,600,700,800&display=swap" rel="stylesheet" />
            </Head>

            <div className="practice-landing relative min-h-[100svh] font-sans text-slate-900" style={{ backgroundColor: BG }}>
                <Background mode={mode} />

                <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
                    <Link href="/" className="shrink-0">
                        <img src={img('ht-logo')} alt="HomeTutor" className="h-11 w-auto" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <LanguageSwitch />
                        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900 sm:px-4">
                            <ArrowLeftIcon className="h-4 w-4" /><span className="hidden sm:inline">{t('auth_page.back_home', 'Back to home')}</span>
                        </Link>
                    </div>
                </header>

                <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-8 sm:px-6 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:pt-0">
                    <Story storyKey={storyKey} />

                    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="w-full rounded-3xl border border-white bg-white/95 p-6 shadow-[0_30px_80px_-30px_rgba(30,64,175,.35)] ring-1 ring-slate-900/5 backdrop-blur sm:p-8">
                        <div role="tablist" className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                            {[['login', t('auth_page.login_tab', 'Log in')], ['register', t('auth_page.register_tab', 'Register')]].map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="tab"
                                    aria-selected={mode === key}
                                    onClick={() => setMode(key)}
                                    className={`relative rounded-lg px-4 py-2.5 text-sm font-bold transition ${mode === key ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {mode === key && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                                    <span className="relative">{label}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div key={mode} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.25 }} className="mt-6">
                                {isLogin ? (
                                    <>
                                        <RolePicker role={role} onChange={chooseRole} />
                                        <div className="mb-5 mt-6">
                                            <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                                {isStudent ? t('auth_page.student_heading', 'Ready to learn today?') : t('auth_page.parent_heading', 'Welcome back.')}
                                            </h2>
                                            <p className="mt-2 leading-relaxed text-slate-600">
                                                {isStudent ? t('auth_page.student_sub', 'Sign in with the username your parent gave you.') : t('auth_page.parent_sub', "Sign in to follow your children's progress.")}
                                            </p>
                                        </div>
                                        <LoginForm role={role} status={status} canResetPassword={canResetPassword} onRegister={() => { chooseRole('parent'); setMode('register'); }} />
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><AcademicCapIcon className="h-6 w-6" /></span>
                                            <div className="text-sm leading-6">
                                                <p className="font-bold text-slate-900">{t('auth_page.student_note_title', 'Are you a student?')}</p>
                                                <p className="text-slate-600">{t('auth_page.student_note_text', "You don't need to register. Your parent creates your login.")}</p>
                                                <button type="button" onClick={() => { chooseRole('student'); setMode('login'); }} className="mt-1 font-semibold text-blue-600 hover:text-blue-800">
                                                    {t('auth_page.student_note_action', 'Sign in as a student')} →
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-5 mt-6">
                                            <h2 className="font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">{t('auth_page.register_heading', 'Create a parent account.')}</h2>
                                            <p className="mt-2 leading-relaxed text-slate-600">{t('auth_page.register_sub', 'Parents register first, choose a package, then create child logins.')}</p>
                                        </div>
                                        <RegisterForm />
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </main>
            </div>
        </>
    );
}
