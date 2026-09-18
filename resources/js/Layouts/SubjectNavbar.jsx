import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import ProfileDropdown from '@/Components/ProfileDropdown';
import SubjectMenuDropdown from '@/Components/SubjectMenuDropdown';
import { useLanguage } from '@/Contexts/LanguageContext';
import { Link, usePage } from '@inertiajs/react';
import { HomeIcon, Squares2X2Icon, TrophyIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';

const appMenuItems = [
    { name: 'Quiz Arena', href: '/quiz-page', icon: '/images/logo_award.png' },
    { name: 'ePTRS', href: 'https://eptrs.my', icon: '/images/logo_PTRS.png', external: true },
];

export default function SubjectNavbar({ title }) {
    const { locale, t } = useLanguage();
    const pageProps = usePage().props;
    const { auth } = pageProps;
    const user = auth?.user;
    const student = pageProps.student ?? auth?.student ?? user?.student;
    const userLevel = locale === 'ms'
        ? (student?.level?.name_my || student?.level?.name)
        : (student?.level?.name || student?.level?.name_my);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
    const palette = resolveDashboardTheme(pageProps.studentTheme);
    const closeMenus = () => { setIsMenuOpen(false); setIsAppMenuOpen(false); };

    return (
        <nav className="sticky top-0 z-[110] border-b shadow-[0_8px_26px_rgba(8,123,184,.2)]" style={{ background: palette.hero, borderColor: `${palette.accent}99` }}>
            <div className="relative mx-auto max-w-[1600px] px-3 py-2 sm:px-5 lg:px-8">
                <div className="flex h-12 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Link href="/dashboard" aria-label="HomeTutor dashboard" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#082c58] text-white shadow-[0_5px_12px_rgba(4,31,68,.25)] transition hover:-translate-y-0.5 hover:bg-[#061f42]"><HomeIcon className="h-5 w-5" /></Link>
                        <Link href="/quiz-page" aria-label="Quiz Arena" className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#d99a00] shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:flex"><TrophyIcon className="h-5 w-5" /></Link>
                        <div className="hidden h-7 w-px bg-white/35 md:block" />
                        <Link href="/dashboard" className="hidden shrink-0 items-center rounded-xl bg-white/95 p-1 shadow-sm md:flex"><ApplicationLogo className="h-8 w-auto object-contain" /></Link>
                        <SubjectMenuDropdown title={title} isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} onToggle={() => setIsAppMenuOpen(false)} />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                        <Link  aria-label="Your learning level" className="hidden h-11 items-center gap-2 rounded-2xl border border-white/60 bg-white/90 px-3 text-xs font-extrabold text-[#087bb8] shadow-sm transition hover:-translate-y-0.5 hover:bg-white lg:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" />{userLevel || t('your_level', 'Your level')}</Link>
                        {/* <div className="relative">
                            <button type="button" onClick={() => { setIsAppMenuOpen((open) => !open); setIsMenuOpen(false); }} aria-label="Open quick access" aria-expanded={isAppMenuOpen} className={`flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-white/80 ${isAppMenuOpen ? 'border-white bg-[#082c58] text-white' : 'border-white/70 bg-white/90 text-[#087bb8] hover:-translate-y-0.5 hover:bg-white'}`}><Squares2X2Icon className="h-5 w-5" /></button>
                            <div className={`absolute right-0 top-[calc(100%+0.75rem)] z-[60] w-64 origin-top-right rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/20 transition duration-200 ${isAppMenuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}><p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Quick access</p><div className="grid grid-cols-2 gap-2">{appMenuItems.map((item) => item.external ? <a key={item.name} href={item.href} target="_blank" rel="noreferrer" onClick={closeMenus} className="group rounded-2xl p-3 text-center transition hover:bg-sky-50"><img src={item.icon} alt="" className="mx-auto h-12 w-12 rounded-xl object-contain shadow-sm" /><span className="mt-2 block text-xs font-bold text-slate-700 group-hover:text-[#087bb8]">{item.name}</span></a> : <Link key={item.name} href={item.href} onClick={closeMenus} className="group rounded-2xl p-3 text-center transition hover:bg-sky-50"><img src={item.icon} alt="" className="mx-auto h-12 w-12 rounded-xl object-contain shadow-sm" /><span className="mt-2 block text-xs font-bold text-slate-700 group-hover:text-[#087bb8]">{item.name}</span></Link>)}</div></div>
                        </div> */}
                        <div className="hidden rounded-2xl bg-white/90 p-0.5 shadow-sm sm:block"><LanguageSwitcher type="buttons" /></div>
                        <div className="sm:hidden"><LanguageSwitcher type="dropdown" /></div>
                        <div className="rounded-2xl bg-white/90 p-1 shadow-sm"><ProfileDropdown user={user} student={user?.student} /></div>
                    </div>
                </div>
            </div>
            {(isMenuOpen || isAppMenuOpen) && <button type="button" aria-label="Close menu" onClick={closeMenus} className="fixed inset-0 z-40 cursor-default" />}
        </nav>
    );
}
