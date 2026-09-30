import ApplicationLogo from '@/Components/ApplicationLogo';
import ProfileDropdown from '@/Components/ProfileDropdown';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
  AcademicCapIcon,
  Bars3Icon,
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  HomeIcon,
  PuzzlePieceIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';

const isCurrent = (pattern) => {
  try { return Boolean(route().current(pattern)); } catch { return false; }
};

// Send every course link to the subject's Practice tab; the backend picks the student's own level.
const subjectUrl = (subject) => route('subject-page', {
  subject: subject.abbr || subject.name.toLowerCase().replace(/\s+/g, '-'),
  subject_id: subject.id,
  level_id: subject.level_id,
});

/**
 * Top navigation for the student portal (dashboard and subject pages).
 * Coloured from the student's theme and Theme Studio accent:
 *  - web (lg+): full labels
 *  - tablet (md): icon-only links with tooltips
 *  - mobile: logo, profile and a menu drawer
 */
export default function StudentNavbar() {
  const { t } = useLanguage();
  const { auth, schoolSubjects = [], studentTheme, canPlayGames, subject_id: currentSubjectId } = usePage().props;
  const user = auth?.user;
  const palette = resolveDashboardTheme(studentTheme, studentTheme?.custom);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const coursesRef = useRef(null);

  useEffect(() => {
    const closeAll = () => { setCoursesOpen(false); setDrawerOpen(false); };
    const onPointer = (event) => { if (coursesRef.current && !coursesRef.current.contains(event.target)) setCoursesOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') closeAll(); };
    const onResize = () => { if (window.innerWidth >= 768) setDrawerOpen(false); };
    const stopNavigate = router.on('navigate', closeAll);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      stopNavigate();
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const links = [
    { key: 'dashboard', label: 'Dashboard', href: route('dashboard'), icon: HomeIcon, active: isCurrent('dashboard') },
    { key: 'quiz', label: t('quiz_arena', 'Quiz Arena'), href: route('quiz-arena.index'), icon: Squares2X2Icon, active: isCurrent('quiz-arena*') },
    ...(canPlayGames ? [{ key: 'play', label: 'HomeTutor Play', href: route('games.play'), icon: PuzzlePieceIcon, external: true }] : []),
  ];
  const coursesActive = isCurrent('subject-*');
  const coursesLabel = t('courses', 'Courses');

  return (
    <nav
      className="sticky top-0 z-[110] border-t-4 text-white shadow-[0_8px_24px_rgba(2,12,30,.28)]"
      style={{
        '--nav-accent': palette.accent,
        '--nav-strong': `color-mix(in srgb, ${palette.accent} 70%, #061a3a)`,
        '--nav-soft': `color-mix(in srgb, ${palette.accent} 40%, white)`,
        borderTopColor: palette.accent,
        background: `linear-gradient(100deg, color-mix(in srgb, ${palette.accent} 48%, #061a3a), color-mix(in srgb, ${palette.accent} 24%, #061a3a))`,
      }}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-[72px] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 md:gap-4 xl:gap-6">
          <Link href={route('dashboard')} aria-label="PTRS Learning dashboard" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
              <ApplicationLogo className="h-9 w-9 object-contain" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold leading-none tracking-tight">Hometutor</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--nav-soft)]">Student portal</span>
            </span>
          </Link>

          <span className="hidden h-7 w-px bg-white/20 md:block" />

          <div className="hidden min-w-0 items-center gap-1 md:flex">
            <NavLink item={links[0]} />
            <div className="relative" ref={coursesRef}>
              <button type="button" onClick={() => setCoursesOpen((open) => !open)} aria-expanded={coursesOpen} aria-haspopup="true" className={`${linkClass(coursesActive)} ${coursesOpen && !coursesActive ? 'bg-white/15 text-white' : ''}`}>
                <AcademicCapIcon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
                <span className="sr-only lg:not-sr-only">{coursesLabel}</span>
                <ChevronDownIcon className={`h-3.5 w-3.5 transition ${coursesOpen ? 'rotate-180' : ''}`} />
                {!coursesOpen && <Tooltip label={coursesLabel} />}
              </button>
              {coursesOpen && (
                <div className="absolute left-0 top-[calc(100%+0.75rem)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl shadow-slate-950/40">
                  <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t('your_subjects', 'Your subjects')}</p>
                  <SubjectList subjects={schoolSubjects} currentId={currentSubjectId} />
                </div>
              )}
            </div>
            {links.slice(1).map((item) => <NavLink key={item.key} item={item} />)}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400 ring-2 ring-white/40" />
          </button>
          <span className="hidden h-7 w-px bg-white/20 sm:block" />
          <ProfileDropdown user={user} student={user?.student} variant="compact" />
          <button type="button" onClick={() => setDrawerOpen((open) => !open)} aria-expanded={drawerOpen} aria-controls="student-nav-drawer" aria-label={drawerOpen ? 'Close menu' : 'Open menu'} className="flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/10 md:hidden">
            {drawerOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <>
          <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="fixed inset-0 top-[68px] z-[-1] cursor-default bg-slate-950/40 md:hidden" />
          <div id="student-nav-drawer" className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-white/10 px-3 pb-5 pt-3 md:hidden" style={{ background: `color-mix(in srgb, ${palette.accent} 34%, #061a3a)` }}>
            <div className="grid gap-1">
              {links.map((item) => {
                const Tag = item.external ? 'a' : Link;
                return (
                  <Tag key={item.key} href={item.href} aria-current={item.active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${item.active ? 'bg-white font-bold text-[var(--nav-strong)]' : 'font-medium text-white/85 hover:bg-white/10'}`}>
                    <item.icon className="h-5 w-5" /> {item.label}
                  </Tag>
                );
              })}
            </div>
            <p className="mt-3 border-t border-white/10 px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--nav-soft)]">{coursesLabel}</p>
            <div className="grid gap-1 sm:grid-cols-2">
              {schoolSubjects.length ? schoolSubjects.map((subject) => {
                const active = String(subject.id) === String(currentSubjectId);
                return (
                  <Link key={subject.id} href={subjectUrl(subject)} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm ${active ? 'bg-white/15 font-bold text-white' : 'text-white/80 hover:bg-white/10'}`}>
                    <AcademicCapIcon className="h-4 w-4 shrink-0" /><span className="truncate">{subject.name}</span>{active && <CheckIcon className="ml-auto h-4 w-4" />}
                  </Link>
                );
              }) : <p className="px-4 py-3 text-sm text-white/60">No subjects available yet.</p>}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

const linkClass = (active) => `group relative flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm transition lg:px-3.5 ${active ? 'bg-white font-bold text-[var(--nav-strong)] shadow-sm' : 'font-medium text-white/80 hover:bg-white/10 hover:text-white'}`;

function NavLink({ item }) {
  const Tag = item.external ? 'a' : Link;
  return (
    <Tag href={item.href} aria-current={item.active ? 'page' : undefined} className={linkClass(item.active)}>
      <item.icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
      <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">{item.label}</span>
      <Tooltip label={item.label} />
    </Tag>
  );
}

function Tooltip({ label }) {
  // Only needed on tablet, where links show icons without their labels.
  return <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block lg:hidden">{label}</span>;
}

function SubjectList({ subjects, currentId }) {
  if (!subjects.length) return <p className="px-3 py-5 text-sm text-slate-400">No subjects available yet.</p>;
  return (
    <div className="max-h-80 overflow-y-auto">
      {subjects.map((subject) => {
        const active = String(subject.id) === String(currentId);
        return (
          <Link key={subject.id} href={subjectUrl(subject)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-[color-mix(in_srgb,var(--nav-accent)_12%,white)] text-[var(--nav-strong)]' : 'text-slate-700 hover:bg-slate-50'}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--nav-accent)' }}><AcademicCapIcon className="h-4 w-4" /></span>
            <span className="truncate">{subject.name}</span>
            {active && <CheckIcon className="ml-auto h-4 w-4" />}
          </Link>
        );
      })}
    </div>
  );
}
