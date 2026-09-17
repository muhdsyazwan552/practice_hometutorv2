import { Head, Link, useForm } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, DevicePhoneMobileIcon, LockClosedIcon, MapPinIcon, SparklesIcon, UserIcon } from '@heroicons/react/24/outline';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import RegisterForm from './Register';

const benefits = [
    'Digital learning content for every stage',
    'Practice built around mastery',
    'A clearer view of learning progress',
];

export default function Login({ status, canResetPassword }) {
    const [isLogin, setIsLogin] = useState(true);
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
        <>
            <Head title={isLogin ? 'Log in' : 'Create an account'} />

            <main className="min-h-screen bg-[#061f42] p-3 sm:p-5 lg:p-7">
                <div className="relative mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
                    <section className="relative hidden overflow-hidden bg-[#082c58] px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-14">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(36,190,241,.35),transparent_26%),radial-gradient(circle_at_90%_85%,rgba(242,194,55,.23),transparent_30%)]" />
                        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:38px_38px]" />

                        <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white"><ArrowLeftIcon className="h-4 w-4" /> Back to home</Link>
                        <div className="relative z-10 mt-12"><img src="/images/HT_Rectangle_3D.png" alt="HomeTutor" className="h-20 w-auto rounded-xl bg-white p-2 object-contain" /></div>

                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 my-auto max-w-xl pt-16">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-cyan-100 backdrop-blur"><SparklesIcon className="h-4 w-4 text-[#ffdc50]" /> Your learning space</div>
                            <h1 className="mt-6 text-4xl font-bold leading-tight xl:text-5xl">Keep your learning moving forward.</h1>
                            <p className="mt-5 max-w-lg text-lg leading-8 text-blue-100">Access focused lessons, purposeful practice and a clearer picture of your progress in one place.</p>
                            <ul className="mt-9 space-y-4">
                                {benefits.map((benefit, index) => (
                                    <motion.li key={benefit} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + index * 0.1 }} className="flex items-center gap-3 text-blue-50">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f2c237] text-[#082c58]"><CheckCircleIcon className="h-4 w-4" /></span>
                                        {benefit}
                                    </motion.li>
                                ))}
                            </ul>
                            <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100"><DevicePhoneMobileIcon className="h-5 w-5 text-[#ffdc50]" /> Ready on phone, tablet and desktop</div>
                        </motion.div>

                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }} className="relative z-10 mt-10 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
                            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Today’s focus</p><p className="mt-1 font-bold">Make progress, one topic at a time.</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-[#ffdc50]"><SparklesIcon className="h-6 w-6" /></div></div>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><motion.div animate={{ width: ['18%', '72%', '46%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="h-full rounded-full bg-[#ffdc50]" /></div>
                        </motion.div>
                    </section>

                    <section className="relative flex min-h-full items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
                        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#e8f7ff] blur-3xl" />
                        <div className="relative w-full max-w-md">
                            <Link href="/" className="mb-10 flex items-center gap-2 text-sm font-semibold text-[#087bb8] lg:hidden"><ArrowLeftIcon className="h-4 w-4" /> Back to HomeTutor</Link>
                            <img src="/images/HT_Rectangle_3D.png" alt="HomeTutor" className="mb-10 h-14 w-auto object-contain lg:hidden" />

                            <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0788c9]">HomeTutor account</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#082c58]">{isLogin ? 'Welcome back.' : 'Create a parent account.'}</h2><p className="mt-3 leading-7 text-slate-500">{isLogin ? 'Parents and children use the same secure login.' : 'Parents register first, choose a package, then create child logins.'}</p></div>

                            <div className="mb-8 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setIsLogin(true)} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${isLogin ? 'bg-white text-[#082c58] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Log in</button><button type="button" onClick={() => setIsLogin(false)} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${!isLogin ? 'bg-white text-[#082c58] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Register</button></div>

                            <AnimatePresence mode="wait">
                                <motion.div key={isLogin ? 'login' : 'register'} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.25 }}>
                                    {isLogin ? (
                                        <form onSubmit={submit} className="space-y-5">
                                            {status && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{status}</div>}
                                            <div><InputLabel htmlFor="username" value="Email or username" className="font-semibold text-slate-700" /><div className="relative mt-2"><UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><TextInput id="username" type="text" name="username" value={data.username} className="block w-full rounded-xl border-slate-200 py-3 pl-11 pr-4 text-slate-800 shadow-sm transition focus:border-[#0788c9] focus:ring-[#0788c9]" autoComplete="username" onChange={(event) => setData('username', event.target.value)} required autoFocus /></div><InputError message={errors.username} className="mt-2" /></div>
                                            <div><InputLabel htmlFor="password" value="Password" className="font-semibold text-slate-700" /><div className="relative mt-2"><LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><TextInput id="password" type="password" name="password" value={data.password} className="block w-full rounded-xl border-slate-200 py-3 pl-11 pr-4 text-slate-800 shadow-sm transition focus:border-[#0788c9] focus:ring-[#0788c9]" autoComplete="current-password" onChange={(event) => setData('password', event.target.value)} required /></div><InputError message={errors.password} className="mt-2" /></div>
                                            <div className="flex items-center justify-between"><label className="flex items-center text-sm font-medium text-slate-600"><Checkbox name="remember" checked={data.remember} onChange={(event) => setData('remember', event.target.checked)} /><span className="ml-2">Remember me</span></label>{canResetPassword && <Link href={route('password.request')} className="text-sm font-bold text-[#0788c9] hover:text-[#082c58]">Forgot password?</Link>}</div>
                                            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                                                {locationStatus === 'shared' ? <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircleIcon className="h-4 w-4" /> Approximate location shared for this sign-in.</p> : locationRequested ? <p className="text-xs leading-5 text-slate-500">Location permission was already requested on this device. You can still sign in safely without it.</p> : <div className="flex flex-wrap items-center justify-between gap-2"><p className="max-w-[220px] text-xs leading-5 text-slate-500">Optional: share your approximate location once to help protect your account.</p><button type="button" onClick={requestLocation} disabled={locationStatus === 'requesting'} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#087bb8] shadow-sm ring-1 ring-sky-100 transition hover:bg-sky-50 disabled:cursor-wait"><MapPinIcon className="h-4 w-4" />{locationStatus === 'requesting' ? 'Requesting…' : 'Share once'}</button></div>}
                                                {locationStatus === 'unsupported' && <p className="mt-2 text-xs font-medium text-amber-700">This browser does not support location sharing.</p>}
                                                {locationStatus === 'unavailable' && <p className="mt-2 text-xs font-medium text-slate-500">Location was not shared. You can continue signing in.</p>}
                                            </div>
                                            <PrimaryButton disabled={processing} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0788c9] py-3.5 text-sm font-bold shadow-[0_12px_24px_rgba(7,136,201,.2)] transition hover:bg-[#056fa7] focus:bg-[#056fa7] active:bg-[#056fa7]">{processing ? 'Signing in…' : 'Sign in to HomeTutor'}<ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" /></PrimaryButton>
                                            <p className="pt-1 text-center text-sm text-slate-500">New to HomeTutor? <button type="button" onClick={() => setIsLogin(false)} className="font-bold text-[#0788c9] hover:text-[#082c58]">Create an account</button></p>
                                        </form>
                                    ) : <RegisterForm />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
