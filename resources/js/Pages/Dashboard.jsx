import { useMemo } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';
import { resolveDashboardTheme } from '@/utils/dashboardTheme';
import ActivityCalendar from '@/Components/ActivityCalendar';

const cardMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

// "Editorial Bento" palette for the My Courses tiles — a fixed color per
// subject (by its position in the list) so each subject keeps the same
// identity whether it's the featured tile or a small one.
const BENTO_ACCENTS = ['#1F6F5C', '#6D28D9', '#1D4ED8', '#9D174D', '#B45309', '#3E4C1F', '#0E7490', '#7C2D12'];

// Copy for the big featured tile, based on how far the student actually is.
function heroCaption(subject) {
  if (!subject?.topicsTotal) return { badge: 'Coming soon', line: 'Topics coming soon' };
  if (subject.progressPercentage >= 100) return { badge: 'Fully mastered', line: `${subject.topicsAnswered} of ${subject.topicsTotal} topics · try a challenge to stay sharp` };
  if (subject.progressPercentage > 0) return { badge: 'Continue practising', line: `${subject.topicsAnswered} of ${subject.topicsTotal} topics practised` };
  return { badge: 'Start here', line: `${subject.topicsTotal} topics waiting for you` };
}

// Themes with a real illustrated mascot under public/images/characters.
// Any theme not listed here falls back to a geometric motif shape below
// instead of inventing an image that doesn't exist.
const THEME_CHARACTERS = {
  'cat-club': '/images/characters/cat-club.png',
  'sky-kingdom': '/images/characters/sky-kingdom.png',
  'dino-discovery': '/images/characters/dino-discovery.png',
  'brick-builders': '/images/characters/brick-builders.png',
  'robo-lab': '/images/characters/robo-lab.png',
  'study-campus': '/images/characters/study-campus.png',
};

function themeMotifShape(slug = '') {
  if (/space|sky|campus/.test(slug)) return 'star';
  if (/jungle|dino/.test(slug)) return 'leaf';
  if (/ocean/.test(slug)) return 'bubble';
  if (/candy|gold/.test(slug)) return 'gem';
  if (/brick/.test(slug)) return 'block';
  if (/cat/.test(slug)) return 'paw';
  return 'spark';
}

const HERO_MOTIF_LAYOUT = [
  { top: '12%', left: '58%', size: 22, duration: 6, delay: 0 },
  { top: '68%', left: '48%', size: 16, duration: 7.5, delay: 0.6 },
  { top: '22%', left: '72%', size: 14, duration: 5.5, delay: 1.1 },
  { top: '78%', left: '66%', size: 20, duration: 8, delay: 0.3 },
  { top: '40%', left: '80%', size: 12, duration: 6.5, delay: 1.6 },
  { top: '52%', left: '36%', size: 18, duration: 7, delay: 0.9 },
];

function HeroMotifIcon({ shape }) {
  const common = { viewBox: '0 0 24 24', className: 'h-full w-full', fill: 'white', fillOpacity: 0.5 };
  switch (shape) {
    case 'star':
      return <svg {...common}><polygon points="12,2 14.9,8.6 22,9.3 16.7,14.1 18.2,21 12,17.3 5.8,21 7.3,14.1 2,9.3 9.1,8.6" /></svg>;
    case 'leaf':
      return <svg {...common}><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(45 12 12)" /></svg>;
    case 'bubble':
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
    case 'gem':
      return <svg {...common}><polygon points="12,2 20,9 12,22 4,9" /></svg>;
    case 'block':
      return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="3" /></svg>;
    case 'paw':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="15" rx="6" ry="5" />
          <circle cx="5" cy="8" r="2.6" />
          <circle cx="11" cy="4.5" r="2.6" />
          <circle cx="17" cy="8" r="2.6" />
        </svg>
      );
    default:
      return <svg {...common}><polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10" /></svg>;
  }
}

function formatTime(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const {
    auth,
    profileData,
    courses = [],
    assignments = [],
    quizSessions = [],
    friends = [],
    pendingRequests = [],
    schoolSubjects = [],
    dashboardTheme,
    learningSpaceCardTheme,
    activityCalendar,
    streaks,
    quizStats,
    friendsCount = 0,
    pendingRequestsCount = 0,
  } = usePage().props;

  const user = auth?.user || {};
  const firstName = (profileData?.name || user.name || 'Learner').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dashboardPalette = resolveDashboardTheme(dashboardTheme);
  const learningCardPalette = resolveDashboardTheme(learningSpaceCardTheme || dashboardTheme);
  const heroThemeSlug = learningSpaceCardTheme?.slug || dashboardTheme?.slug || '';
  const heroCharacter = THEME_CHARACTERS[heroThemeSlug];
  const heroMotif = themeMotifShape(heroThemeSlug);

  const averageScore = quizStats?.averageScore ?? 0;
  const bestScore = quizStats?.bestScore ?? null;
  const quizAttempts = quizStats?.attempts ?? 0;
  const currentRank = quizSessions.findIndex((item) => item.user_id === user.id) + 1;
  const practiceToday = streaks?.answersToday ?? 0;
  const dayStreak = streaks?.login ?? 0;

  const leaderboard = quizSessions.slice(0, 5).map((session, index) => ({
    rank: index + 1,
    name: session.display_name || 'Anonymous learner',
    school: session.school?.name || 'PTRS learner',
    time: session.total_time_seconds || 0,
    score: session.total_correct || 0,
    isCurrentUser: session.user_id === user.id,
  }));

  // `schoolSubjects` (shared globally via HandleInertiaRequests for the nav
  // menu) only carries id/name/abbr — no progress. `courses` is the one built
  // by DashboardController with real topicsAnswered/topicsTotal, so it must
  // win here even when schoolSubjects is also present.
  const featuredSubjects = courses.length ? courses : schoolSubjects;

  // Give each subject a stable accent color by its position in the list,
  // then pull out whichever one the student is furthest into as the big
  // featured tile — the rest flow into the smaller bento tiles below it.
  const bentoSubjects = featuredSubjects.map((subject, index) => ({
    ...subject,
    bentoColor: BENTO_ACCENTS[index % BENTO_ACCENTS.length],
  }));
  const heroSubject = bentoSubjects.length
    ? bentoSubjects.reduce((best, s) => ((s.progressPercentage ?? 0) > (best.progressPercentage ?? 0) ? s : best), bentoSubjects[0])
    : null;
  const tileSubjects = bentoSubjects.filter((s) => s !== heroSubject);

  // Route straight to the subject's Practice tab, letting the backend pick
  // the student's own level/form automatically instead of hardcoding Form 4/5.
  const getSubjectUrl = (subject) => {
    if (!subject?.id) return route('quiz-page');
    const slug = subject.abbr || subject.name.toLowerCase().replace(/\s+/g, '-');
    return route('subject-page', {
      subject: slug,
      subject_id: subject.id,
      level_id: subject.level_id,
    });
  };

  // Real Mon–Sun status for "Weekly goal", built from the same login/practice
  // dates used by the monthly activity calendar (instead of a hardcoded example).
  const weekDays = useMemo(() => {
    const loginSet = new Set(activityCalendar?.loginDates || []);
    const practiceSet = new Set(activityCalendar?.practiceDates || []);
    const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);

    return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = dateKey(date);
      return {
        label,
        key,
        active: loginSet.has(key) || practiceSet.has(key),
        isFuture: date > today,
      };
    });
  }, [activityCalendar]);

  const activeWeekDaysCount = weekDays.filter((day) => day.active).length;
  const remainingOpportunityDays = 7 - activeWeekDaysCount;

  const stats = [
    { label: 'Learning progress', value: `${averageScore}%`, helper: quizAttempts ? `${quizAttempts} quiz attempts` : 'Start your first quiz', icon: ChartBarIcon, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Best score', value: bestScore !== null ? `${bestScore}/5` : '—', helper: bestScore !== null ? 'Personal best' : 'No score yet', icon: TrophyIcon, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Day streak', value: `${dayStreak} day${dayStreak === 1 ? '' : 's'}`, helper: practiceToday ? `${practiceToday} practice done today` : 'No practice yet today', icon: FireIcon, tone: 'text-rose-600 bg-rose-50' },
    { label: 'Community', value: friendsCount, helper: `${pendingRequestsCount} pending request${pendingRequestsCount === 1 ? '' : 's'}`, icon: UserGroupIcon, tone: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <DashboardLayout>
      <Head title="Dashboard" />

      <main
        className={`student-theme-dashboard mx-auto w-full max-w-[1280px] mt-2 px-4 py-4 sm:px-6 lg:px-10 lg:py-4 ${dashboardPalette.background ? 'has-theme-bg' : ''}`}
        style={{
          '--theme-page': dashboardPalette.page,
          '--theme-card': dashboardPalette.card,
          '--theme-accent': dashboardPalette.accent,
          '--theme-ink': dashboardPalette.ink,
        }}
      >
        <motion.section
          {...cardMotion}
          transition={{ duration: 0.35 }}
          className="student-theme-hero relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10 lg:py-9"
          style={
            dashboardPalette.background
              ? {
                  background: `linear-gradient(135deg, color-mix(in srgb, ${learningCardPalette.accent} 68%, transparent), color-mix(in srgb, ${learningCardPalette.ink} 55%, transparent))`,
                  backdropFilter: 'blur(16px) saturate(1.2)',
                  WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                }
              : { background: learningCardPalette.hero }
          }
        >
          <div className="hero-shimmer" />

          <motion.div
            className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, -14, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-8rem] right-48 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
            animate={{ x: [0, -16, 0], y: [0, 12, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />

          {!heroCharacter && HERO_MOTIF_LAYOUT.map((motif, index) => (
            <motion.div
              key={index}
              className="pointer-events-none absolute hidden sm:block"
              style={{ top: motif.top, left: motif.left, width: motif.size, height: motif.size }}
              animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0], opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: motif.duration, delay: motif.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              <HeroMotifIcon shape={heroMotif} />
            </motion.div>
          ))}

          {heroCharacter && (
            <motion.img
              key={heroCharacter}
              src={heroCharacter}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 right-2 hidden h-[92%] max-h-64 w-auto object-contain drop-shadow-2xl sm:block lg:right-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{ opacity: { duration: 0.5 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
            />
          )}

          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <motion.span
                className="inline-flex"
                animate={{ rotate: [0, 18, -12, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <SparklesIcon className="h-4 w-4" />
              </motion.span>
              Your learning space
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-2 text-sm font-semibold text-white/90 sm:text-base">
              {profileData?.name || user.name} · {profileData?.grade || 'Form 5'}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Pick up where you left off, build your streak, and make today&apos;s study session count.
            </p>
          </div>
        </motion.section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} {...cardMotion} transition={{ duration: 0.35, delay: 0.06 * (index + 1) }} className="theme-glass-card rounded-2xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-600">{stat.helper}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${stat.tone}`}><stat.icon className="h-5 w-5" /></div>
              </div>
            </motion.div>
          ))}
        </section>

        {activityCalendar?.months?.length > 0 && (
          <motion.section {...cardMotion} transition={{ duration: 0.35, delay: 0.14 }} className="theme-surface mt-5 rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Kalendar pembelajaran</h2>
                <p className="mt-1 text-sm text-slate-500">Hari log masuk dan hari buat latihan untuk 3 bulan terakhir.</p>
              </div>
              <div
                className="rounded-xl p-2.5"
                style={{ background: 'color-mix(in srgb, var(--theme-accent) 12%, white)', color: 'var(--theme-accent)' }}
              >
                <CalendarDaysIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5">
              <ActivityCalendar
                months={activityCalendar.months}
                loginDates={activityCalendar.loginDates}
                practiceDates={activityCalendar.practiceDates}
              />
            </div>
          </motion.section>
        )}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <motion.section
              {...cardMotion}
              transition={{ duration: 0.35, delay: 0.18 }}
              className="theme-surface relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-8"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />

              <div className="relative mb-6">
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Learning Hub</span>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{t('my_courses', 'My courses')}</h2>
                <p className="mt-1 text-sm text-slate-500">Pick up where you left off across every subject.</p>
              </div>

              {bentoSubjects.length ? (
                <div className="relative">
                  {heroSubject && (() => {
                    const caption = heroCaption(heroSubject);
                    return (
                      <Link
                        href={getSubjectUrl(heroSubject)}
                        className="mb-4 flex flex-col gap-5 rounded-[20px] p-6 transition hover:brightness-[1.06] sm:flex-row sm:items-center sm:justify-between"
                        style={{ background: heroSubject.bentoColor }}
                      >
                        <div>
                          <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: 'rgba(255,255,255,0.16)' }}>
                            {caption.badge}
                          </span>
                          <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                            {heroSubject.name || heroSubject.title}
                          </h3>
                          <p className="mt-1 text-sm text-white/75">{caption.line}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-4xl font-bold text-white sm:text-5xl">
                            {heroSubject.progressPercentage ?? 0}%
                          </div>
                        </div>
                      </Link>
                    );
                  })()}

                  <div
                    className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 ${
                      tileSubjects.length > 6 ? 'max-h-[420px] overflow-y-auto pr-1 course-scroll' : ''
                    }`}
                  >
                    {tileSubjects.map((subject, index) => {
                      const topicsTotal = subject.topicsTotal ?? subject.total ?? 0;
                      const topicsAnswered = Math.min(subject.topicsAnswered ?? subject.progress ?? 0, topicsTotal);
                      const percentage = topicsTotal
                        ? subject.progressPercentage ?? Math.round((topicsAnswered / topicsTotal) * 100)
                        : 0;
                      const started = topicsAnswered > 0;
                      const spanClass = percentage >= 50 ? 'col-span-1 sm:col-span-2 lg:col-span-2' : 'col-span-1 sm:col-span-1 lg:col-span-1';
                      return (
                        <Link
                          key={subject.id || subject.title || index}
                          href={getSubjectUrl(subject)}
                          className={`${spanClass} flex min-h-[150px] flex-col justify-between rounded-2xl p-5 transition hover:brightness-[1.06]`}
                          style={
                            started
                              ? { background: subject.bentoColor }
                              : { background: '#27272E', border: '1px dashed #4B4C55' }
                          }
                        >
                          <h3 className={`text-sm font-bold ${started ? 'text-white/90' : 'text-[#E4E4E7]'}`}>
                            {subject.name || subject.title}
                          </h3>
                          {started ? (
                            <div>
                              <div className="text-3xl font-bold text-white">{percentage}%</div>
                              <p className="mt-1 text-xs text-white/65">{topicsAnswered} of {topicsTotal} topics</p>
                              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                                <motion.div
                                  className="h-full rounded-full bg-white"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-lg font-bold text-[#9A9CA4]">
                                {topicsTotal ? 'Start →' : 'Coming soon'}
                              </div>
                              {topicsTotal ? <p className="mt-1 text-xs text-[#6E7078]">{topicsTotal} topics</p> : null}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
                  <AcademicCapIcon className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">Your courses will appear here</p>
                </div>
              )}
            </motion.section>

            <motion.section {...cardMotion} transition={{ duration: 0.35, delay: 0.24 }} className="theme-surface rounded-2xl border p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Upcoming work</h2>
                  <p className="mt-1 text-sm text-slate-500">Stay focused on what is due next.</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-500"><CalendarDaysIcon className="h-5 w-5" /></div>
              </div>
              <div className="mt-5 space-y-3">
                {assignments.length ? assignments.map((assignment, index) => (
                  <div key={`${assignment.title}-${index}`} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <span className="text-[10px] font-bold uppercase">Due</span><ClockIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{assignment.title}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{assignment.topic} · {assignment.description}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className="text-xs font-medium text-slate-500">{assignment.dueDate}</span>
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">In progress</span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-emerald-50 p-5 text-center text-sm font-medium text-emerald-700">You are all caught up!</div>
                )}
              </div>
            </motion.section>
          </div>

          <aside className="space-y-5">
            <motion.section {...cardMotion} transition={{ duration: 0.35, delay: 0.2 }} className="theme-surface rounded-2xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">Weekly goal</h2>
                  <p className="mt-1 text-xs text-slate-500">{activeWeekDaysCount} of 7 learning days</p>
                </div>
                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-500"><FireIcon className="h-5 w-5" /></div>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <div key={`${day.key}-${index}`} className="text-center">
                    <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${day.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {day.active ? <CheckCircleIcon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </div>
                    <span className="mt-2 block text-[10px] font-semibold text-slate-400">{day.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-indigo-50 px-4 py-3 text-xs leading-5 text-indigo-700">
                {activeWeekDaysCount >= 7 ? (
                  <><span className="font-semibold">Great job!</span> You&apos;ve been active every day this week.</>
                ) : (
                  <><span className="font-semibold">{remainingOpportunityDays} more day{remainingOpportunityDays === 1 ? '' : 's'}!</span> Log in or practise to complete this week&apos;s goal.</>
                )}
              </div>
            </motion.section>

            <motion.section {...cardMotion} transition={{ duration: 0.35, delay: 0.27 }} className="theme-surface overflow-hidden rounded-2xl border shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">Top learners</h2>
                  <p className="mt-0.5 text-xs text-slate-500">This week&apos;s leaderboard</p>
                </div>
                <TrophyIcon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="p-3">
                {leaderboard.length ? leaderboard.map((learner) => (
                  <div key={`${learner.rank}-${learner.name}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${learner.isCurrentUser ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                    <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xs font-bold ${learner.rank === 1 ? 'bg-amber-100 text-amber-700' : learner.rank === 2 ? 'bg-slate-200 text-slate-700' : learner.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>#{learner.rank}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{learner.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{learner.school}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700">{learner.score}/5</p>
                      <p className="text-[10px] text-slate-400">{formatTime(learner.time)}</p>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">Complete a quiz to join the leaderboard.</div>
                )}
              </div>
              <button onClick={() => router.visit(route('quiz-page'))} className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-3.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50">
                View leaderboard <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </motion.section>
          </aside>
        </div>
      </main>
    </DashboardLayout>
  );
}
