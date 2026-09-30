import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  FireIcon,
  SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/Contexts/LanguageContext';
import { resolveDashboardTheme, resolveLearningCard } from '@/utils/dashboardTheme';
import ThemeMotif from '@/Components/ThemeMotif';
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

const HERO_MOTIF_LAYOUT = [
  { top: '12%', left: '58%', size: 22, duration: 6, delay: 0 },
  { top: '68%', left: '48%', size: 16, duration: 7.5, delay: 0.6 },
  { top: '22%', left: '72%', size: 14, duration: 5.5, delay: 1.1 },
  { top: '78%', left: '66%', size: 20, duration: 8, delay: 0.3 },
  { top: '40%', left: '80%', size: 12, duration: 6.5, delay: 1.6 },
  { top: '52%', left: '36%', size: 18, duration: 7, delay: 0.9 },
];

export default function Dashboard() {
  const { t } = useLanguage();
  const {
    auth,
    profileData,
    courses = [],
    schoolSubjects = [],
    dashboardTheme,
    learningSpaceCardTheme,
    studentTheme,
    activityCalendar,
    streaks,
    learningProgress,
    questionsAnswered = 0,
    pointBalance = 0,
  } = usePage().props;

  const user = auth?.user || {};
  const firstName = (profileData?.name || user.name || 'Learner').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const themeCustom = studentTheme?.custom;
  const dashboardPalette = resolveDashboardTheme(dashboardTheme, themeCustom);
  const learningCard = resolveLearningCard({ dashboardTheme, cardTheme: learningSpaceCardTheme, custom: themeCustom });
  const heroCharacter = learningCard.character;
  const heroMotif = learningCard.motif;

  const progressPercentage = learningProgress?.percentage ?? 0;
  const progressTopicsAnswered = learningProgress?.topicsAnswered ?? 0;
  const progressTopicsTotal = learningProgress?.topicsTotal ?? 0;
  const practiceToday = streaks?.answersToday ?? 0;
  const dayStreak = streaks?.login ?? 0;

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

  const stats = [
    { label: 'Learning progress', value: `${progressPercentage}%`, helper: progressTopicsTotal ? `${progressTopicsAnswered} daripada ${progressTopicsTotal} topik dipraktikkan` : 'Belum ada topik untuk tahap ini', icon: ChartBarIcon, tone: 'text-indigo-600 bg-indigo-50' },
    { label: 'Soalan dijawab', value: questionsAnswered.toLocaleString(), helper: 'Jumlah semua soalan yang telah dijawab', icon: TrophyIcon, tone: 'text-amber-600 bg-amber-50' },
    { label: 'Day streak', value: `${dayStreak} day${dayStreak === 1 ? '' : 's'}`, helper: practiceToday ? `${practiceToday} practice done today` : 'No practice yet today', icon: FireIcon, tone: 'text-rose-600 bg-rose-50' },
    { label: 'Total point', value: pointBalance.toLocaleString(), helper: 'Point tersedia untuk Kedai Quiz Arena', icon: SparklesIcon, tone: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <DashboardLayout>
      <Head title="Dashboard" />

      <main
        data-theme-style={dashboardTheme?.slug}
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
            learningCard.glass
              ? { background: learningCard.background, backdropFilter: 'blur(16px) saturate(1.2)', WebkitBackdropFilter: 'blur(16px) saturate(1.2)' }
              : { background: learningCard.background }
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
              <ThemeMotif shape={heroMotif} />
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
              {learningCard.badge || 'Your learning space'}
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

        <div className="mt-5">
          <div className="space-y-5">
            <motion.section
              {...cardMotion}
              transition={{ duration: 0.35, delay: 0.18 }}
              className="theme-surface relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-8"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />

              <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Learning Hub</span>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">{t('my_courses', 'My courses')}</h2>
                  <p className="mt-1 text-sm text-slate-500">Pilih subjek untuk mula atau sambung latihan anda.</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{bentoSubjects.length} subjek</span>
              </div>

              {bentoSubjects.length ? (
                <div className="relative">
                  {heroSubject && (() => {
                    const caption = heroCaption(heroSubject);
                    return (
                      <Link
                        href={getSubjectUrl(heroSubject)}
                        className="group relative mb-5 flex min-h-[220px] overflow-hidden rounded-[28px] border border-white/15 p-6 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:p-8"
                        style={{ background: heroSubject.bentoColor }}
                      >
                        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full border border-white/15" />
                        <div className="relative max-w-xl">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white" style={{ background: 'rgba(255,255,255,0.16)' }}>
                            <BookOpenIcon className="h-3.5 w-3.5" /> {caption.badge}
                          </span>
                          <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                            {heroSubject.name || heroSubject.title}
                          </h3>
                          <p className="mt-2 text-sm text-white/80">{caption.line}</p>
                          <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 shadow-lg shadow-slate-950/10">
                            {heroSubject.progressPercentage ? 'Sambung latihan' : 'Mula latihan'} <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                          </span>
                        </div>
                        <div className="relative mt-2 flex shrink-0 items-center gap-4 sm:mt-0">
                          <div
                            className="grid h-28 w-28 place-items-center rounded-full p-2 shadow-lg shadow-slate-950/20"
                            style={{ background: `conic-gradient(#ffffff ${(heroSubject.progressPercentage ?? 0) * 3.6}deg, rgba(255,255,255,0.2) 0deg)` }}
                          >
                            <div className="grid h-full w-full place-items-center rounded-full text-center" style={{ background: heroSubject.bentoColor }}>
                              <span className="text-3xl font-extrabold text-white">{heroSubject.progressPercentage ?? 0}%</span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">siap</span>
                            </div>
                          </div>
                          <div className="hidden text-left text-sm text-white/80 sm:block"><b className="block text-white">Progress anda</b>{heroSubject.topicsAnswered ?? 0}/{heroSubject.topicsTotal ?? 0} topik</div>
                        </div>
                      </Link>
                    );
                  })()}

                  <div
                    className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
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
                      return (
                        <Link
                          key={subject.id || subject.title || index}
                          href={getSubjectUrl(subject)}
                          className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-3xl border border-white/15 p-5 shadow-md transition duration-300 hover:-translate-y-1 hover:brightness-[1.06] hover:shadow-xl"
                          style={
                            started
                              ? { background: subject.bentoColor }
                              : { background: '#27272E', border: '1px dashed #4B4C55' }
                          }
                        >
                          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
                          <div className="relative flex items-start justify-between gap-3">
                            <span className={`grid h-10 min-w-10 place-items-center rounded-xl text-xs font-extrabold ${started ? 'bg-white/15 text-white' : 'bg-white/10 text-[#E4E4E7]'}`}>{(subject.abbr || subject.name || subject.title || 'S').slice(0, 3).toUpperCase()}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${started ? 'bg-white/15 text-white' : 'bg-white/10 text-[#D4D4D8]'}`}>{percentage}%</span>
                          </div>
                          <div className="relative mt-5">
                            <h3 className={`text-lg font-extrabold tracking-tight ${started ? 'text-white' : 'text-[#E4E4E7]'}`}>{subject.name || subject.title}</h3>
                            <p className={`mt-1 text-xs ${started ? 'text-white/70' : 'text-[#9A9CA4]'}`}>{topicsTotal ? `${topicsAnswered} daripada ${topicsTotal} topik dipraktikkan` : 'Kandungan akan datang'}</p>
                          </div>
                          <div className="relative mt-auto pt-5">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/20"><motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }} /></div>
                            <span className={`mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold ${started ? 'text-white' : 'text-[#E4E4E7]'}`}>{topicsTotal ? (started ? 'Sambung latihan' : 'Mula latihan') : 'Akan datang'} <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                          </div>
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

          </div>

        </div>
      </main>
    </DashboardLayout>
  );
}
