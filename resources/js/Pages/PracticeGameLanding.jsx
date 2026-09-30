import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { THEME_CHARACTERS } from '@/utils/dashboardTheme';
import '../../css/game-landing.css';

// Both backgrounds use three.js, so they load after the text is on screen.
const VantaNet = lazy(() => import('@/Components/GameLanding/VantaNet'));
const PowerCore = lazy(() => import('@/Components/GameLanding/PowerCore'));

const ease = [0.22, 1, 0.36, 1];
const img = (name) => `/images/landing-practice/${name}.webp`;

const subjects = ['Matematik', 'Sains', 'Bahasa Melayu', 'Bahasa Inggeris', 'Sejarah', 'Matematik Tambahan', 'Fizik', 'Kimia', 'Biologi', 'Pendidikan Islam'];

const modes = [
  {
    tag: 'MOD 01',
    title: 'Latihan',
    text: 'Soalan objektif dan subjektif ikut topik. Jawapan disemak serta-merta, lengkap dengan penerangan.',
    image: img('student'),
    accent: 'from-cyan-400 to-sky-500',
    stats: ['Semakan segera', 'Ulang kaji sesi'],
  },
  {
    tag: 'MOD 02',
    title: 'Misi & Mastery',
    text: 'Selesaikan misi topik dan naikkan pangkat mastery setiap kali kemahiran dikuasai.',
    image: img('robo'),
    accent: 'from-violet-400 to-fuchsia-500',
    stats: ['Misi topik', 'Pangkat mastery'],
  },
  {
    tag: 'MOD 03',
    title: 'Quiz Arena',
    text: 'Pertandingan hujung minggu. Kumpul syiling, naik papan pendahulu dan cabar rakan.',
    image: img('quiz-arena-realm'),
    accent: 'from-amber-300 to-orange-500',
    stats: ['Papan pendahulu', 'Syiling & kedai'],
  },
  {
    tag: 'MOD 04',
    title: 'HomeTutor Play',
    text: '14 jenis permainan pembelajaran: aksi, puzzle, padanan dan banyak lagi. Satu log masuk sahaja.',
    image: img('play-magic-game-hero'),
    accent: 'from-pink-400 to-rose-500',
    stats: ['14 jenis permainan', 'Satu akaun'],
    href: () => route('games.play'),
  },
];

const worlds = [
  { world: 'WORLD 1', name: 'Tahun 1 – 3', stage: 'Sekolah rendah · Tahap 1', image: img('level-standard1-3'), stars: 1 },
  { world: 'WORLD 2', name: 'Tahun 4 – 6', stage: 'Sekolah rendah · Tahap 2', image: img('level-standard4-6'), stars: 2 },
  { world: 'WORLD 3', name: 'Tingkatan 1 – 3', stage: 'Menengah rendah', image: img('level-form1-3'), stars: 3 },
  { world: 'WORLD 4', name: 'Tingkatan 4 – 5', stage: 'Menengah atas', image: img('level-form4-5'), stars: 4 },
];

const skins = [
  ['space-explorer', 'Space Explorer', '/images/themes/space-explorer.jpg'],
  ['robo-lab', 'Robo Lab', '/images/themes/robo-lab.png'],
  ['cat-club', 'Cozy Cat Club', '/images/themes/cat-club.jpg'],
  ['brick-builders', 'Brick Builders', '/images/themes/brick-builders.jpg'],
  ['dino-discovery', 'Dino Discovery', '/images/themes/dino-discovery.jpg'],
  ['sky-kingdom', 'Sky Kingdom', '/images/themes/sky-kingdom.jpg'],
  ['gold-champion', 'Gold Champion', '/images/themes/gold-champion.jpg'],
  ['ocean-blue', 'Ocean Blue', '/images/themes/ocean-blue.jpg'],
];

/* ------------------------------------------------------------------ shared */

function Reveal({ children, delay = 0, y = 28, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, delay, ease }} className={className}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ kicker, title, highlight, text, center = false }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <Reveal y={12}>
        <p className={`font-game inline-flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-cyan-300 ${center ? 'justify-center' : ''}`}>
          <span className="h-px w-6 bg-cyan-300/70" />{kicker}<span className="h-px w-6 bg-cyan-300/70" />
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="font-game mt-4 text-4xl font-bold uppercase leading-[1.02] text-white sm:text-5xl lg:text-6xl">
          {title} {highlight && <span className="gl-neon-text">{highlight}</span>}
        </h2>
      </Reveal>
      {text && (
        <Reveal delay={0.16}>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">{text}</p>
        </Reveal>
      )}
    </div>
  );
}

function StartButton({ href, children, className = '' }) {
  return (
    <Link
      href={href}
      className={`gl-clip font-game group relative inline-flex items-center gap-3 overflow-hidden bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-8 py-4 text-base font-bold uppercase tracking-wider text-white shadow-[0_0_40px_-6px_rgba(139,92,246,.8)] transition hover:brightness-110 ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">▶</span>
      <span className="relative">{children}</span>
    </Link>
  );
}

function GhostButton({ href, children }) {
  return (
    <Link href={href} className="gl-clip font-game inline-flex items-center gap-2 border border-white/15 bg-white/5 px-7 py-4 text-base font-bold uppercase tracking-wider text-white backdrop-blur transition hover:border-cyan-300/60 hover:bg-white/10">
      {children}
    </Link>
  );
}

/** Card that tilts toward the pointer. */
function TiltCard({ children, className = '' }) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 200, damping: 18 });

  return (
    <motion.div
      style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        const box = event.currentTarget.getBoundingClientRect();
        mx.set((event.clientX - box.left) / box.width - 0.5);
        my.set((event.clientY - box.top) / box.height - 0.5);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ nav */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = [['Mod', '#mod'], ['Dunia', '#dunia'], ['Ganjaran', '#ganjaran'], ['Tema', '#tema'], ['Ibu bapa', '#ibubapa']];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <nav className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-3 py-2 transition-all duration-500 ${scrolled || open ? 'border-white/10 bg-[#0b0b1a]/80 shadow-[0_10px_40px_-15px_rgba(0,0,0,.8)] backdrop-blur-xl' : 'border-transparent'}`}>
        <a href="#top" className="flex items-center gap-2">
          <img src={img('ht-logo')} alt="HomeTutor" className="h-9 w-auto rounded-lg bg-white/95 px-2 py-1" />
        </a>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="font-game rounded-lg px-3.5 py-2 text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:bg-white/5 hover:text-white">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href={route('login')} className="font-game hidden px-3 py-2 text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:text-white sm:inline-flex">Log masuk</Link>
          <Link href={route('register')} className="gl-clip font-game bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110">Daftar</Link>
          <button type="button" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white lg:hidden">
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-0.5 w-4 bg-current transition ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-4 bg-current transition ${open ? 'opacity-0' : ''}`} />
              <span className={`absolute left-0 h-0.5 w-4 bg-current transition ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-7xl rounded-2xl border border-white/10 bg-[#0b0b1a]/95 p-2 backdrop-blur-xl lg:hidden">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="font-game block rounded-xl px-4 py-3 font-semibold uppercase tracking-wider text-slate-200 hover:bg-white/5">{label}</a>
            ))}
            <Link href={route('login')} className="font-game block rounded-xl px-4 py-3 font-semibold uppercase tracking-wider text-cyan-300 hover:bg-white/5">Log masuk</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  const { scrollY } = useScroll();
  const fade = useTransform(scrollY, [0, 500], [1, 0]);
  const drop = useTransform(scrollY, [0, 500], [0, 80]);

  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-24 pt-28">
      <Suspense fallback={<div className="absolute inset-0 -z-10 bg-[#070712]" />}>
        <VantaNet className="absolute inset-0 -z-10 opacity-70" />
      </Suspense>
      {/* Tint so the text reads over the net, plus a grid floor for depth */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_45%,transparent_0%,rgba(7,7,18,.45)_50%,#070712_100%)]" />
      <div aria-hidden className="absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-[#070712]/80 via-[#070712]/30 to-transparent lg:w-2/3" />
      <div aria-hidden className="gl-grid-floor absolute inset-x-[-20%] bottom-0 -z-10 h-[45%] opacity-60" />
      <div aria-hidden className="gl-scanlines pointer-events-none absolute inset-0 -z-10" />

      <motion.div style={{ opacity: fade, y: drop }} className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-5 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
        <div className="text-center lg:text-left">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease }} className="font-game mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-cyan-200 lg:mx-0">
            <span className="gl-blink h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" /> Tahun 1 – Tingkatan 5
          </motion.p>

          <h1 className="font-game gl-glow-text mt-6 text-[3.1rem] font-bold uppercase leading-[0.95] text-white sm:text-7xl xl:text-8xl">
            {['Belajar.', 'Main.'].map((word, index) => (
              <motion.span key={word} initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.2 + index * 0.15, ease }} className="block">
                {word}
              </motion.span>
            ))}
            <motion.span initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.5, ease }} className="gl-neon-text block">
              Naik level.
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease }} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0">
            HomeTutor Practice jadikan setiap latihan satu misi. Jawab soalan, kumpul syiling, buka tema baharu dan naikkan pangkat mastery, sambil ibu bapa nampak perkembangan dalam satu laporan.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9, ease }} className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <StartButton href={route('register')}>Mula main</StartButton>
            <GhostButton href={route('login')}>Log masuk</GhostButton>
          </motion.div>

          {/* HUD strip */}
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.1 }} className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-2 lg:mx-0">
            {[['14', 'Jenis permainan'], ['11+', 'Tema dunia'], ['4', 'Tahap sekolah']].map(([value, label]) => (
              <div key={label} className="gl-clip border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur">
                <dt className="sr-only">{label}</dt>
                <dd className="font-game text-2xl font-bold text-white sm:text-3xl">{value}</dd>
                <dd className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: 0.3, ease }} className="relative mx-auto aspect-square w-full max-w-[34rem]">
          <div aria-hidden className="absolute inset-[18%] rounded-full bg-violet-600/30 blur-3xl" />
          <Suspense fallback={null}>
            <PowerCore className="absolute inset-0" />
          </Suspense>
          {/* Floating XP chips */}
          {[
            ['+25 XP', 'left-[4%] top-[18%]', 'text-cyan-200 border-cyan-300/40'],
            ['BETUL! ✓', 'right-[2%] top-[34%]', 'text-emerald-200 border-emerald-300/40'],
            ['+10 SYILING', 'left-[10%] bottom-[16%]', 'text-amber-200 border-amber-300/40'],
          ].map(([label, position, tone], index) => (
            <motion.span
              key={label}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.2 + index * 0.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
              className={`font-game pointer-events-none absolute ${position} rounded-lg border bg-[#0b0b1a]/70 px-3 py-1.5 text-xs font-bold tracking-wider backdrop-blur ${tone}`}
            >
              {label}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>

      <a href="#mod" className="font-game absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 transition hover:text-white">
        Scroll
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} className="block h-8 w-5 rounded-full border border-white/25">
          <span className="mx-auto mt-1.5 block h-2 w-1 rounded-full bg-cyan-300" />
        </motion.span>
      </a>
    </section>
  );
}

/* ------------------------------------------------------------------ ticker */

function Ticker() {
  const row = [...subjects, ...subjects];
  return (
    <div className="relative border-y border-white/10 bg-[#0b0b1a] py-4">
      <div className="gl-marquee overflow-hidden">
        <div className="gl-marquee-track" style={{ '--gl-speed': '45s' }}>
          {row.map((subject, index) => (
            <span key={index} className="font-game flex items-center gap-3 whitespace-nowrap px-3 text-lg font-bold uppercase tracking-wider text-slate-300">
              <span className="text-fuchsia-400">✦</span>{subject}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ modes */

function Modes() {
  return (
    <section id="mod" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-6">
      <SectionTitle kicker="PILIH MOD" title="Empat cara" highlight="untuk menang." text="Setiap mod melatih kemahiran yang berbeza. Tukar mod bila-bila masa, kemajuan disimpan dalam satu akaun." />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {modes.map((mode, index) => (
          <Reveal key={mode.tag} delay={index * 0.08} className="h-full">
            <TiltCard className="h-full">
              <article className="gl-neon-border group flex h-full flex-col overflow-hidden rounded-2xl bg-[#0f0f22] shadow-[0_30px_60px_-30px_rgba(0,0,0,.9)]">
                <div className="relative h-44 overflow-hidden">
                  <img src={mode.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f22] via-[#0f0f22]/30 to-transparent" />
                  <span className={`font-game absolute left-4 top-4 rounded-md bg-gradient-to-r ${mode.accent} px-2.5 py-1 text-[11px] font-bold tracking-[0.2em] text-slate-950`}>{mode.tag}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-game text-2xl font-bold uppercase text-white">{mode.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{mode.text}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {mode.stats.map((stat) => (
                      <span key={stat} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300">{stat}</span>
                    ))}
                  </div>
                  <Link href={mode.href ? mode.href() : route('register')} className="font-game mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-300 transition group-hover:gap-3">
                    Main mod ini <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ worlds */

function Worlds() {
  return (
    <section id="dunia" className="relative overflow-hidden border-y border-white/10 bg-[#0b0b1a] py-28">
      <div aria-hidden className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div aria-hidden className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <SectionTitle kicker="PILIH DUNIA" title="Dari Tahun 1" highlight="hingga Tingkatan 5." text="Setiap dunia ikut silibus tahap persekolahan anak. Soalan makin mencabar bila naik dunia." center />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {worlds.map((world, index) => (
            <Reveal key={world.world} delay={index * 0.08}>
              <TiltCard>
                <article className="gl-neon-border group relative overflow-hidden rounded-2xl bg-[#12122a]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={world.image} alt={`Murid ${world.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12122a] via-[#12122a]/20 to-transparent" />
                    <span className="font-game absolute left-4 top-4 text-xs font-bold tracking-[0.3em] text-white/80">{world.world}</span>
                    <span className="absolute right-4 top-4 text-sm text-amber-300 drop-shadow" aria-label={`Tahap cabaran ${world.stars} daripada 4`}>
                      {'★'.repeat(world.stars)}<span className="text-white/25">{'★'.repeat(4 - world.stars)}</span>
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-game text-2xl font-bold uppercase text-white">{world.name}</h3>
                    <p className="text-sm text-slate-400">{world.stage}</p>
                    <Link href={route('register')} className="gl-clip font-game mt-4 inline-flex bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur transition hover:bg-gradient-to-r hover:from-cyan-400 hover:to-violet-500">
                      Masuk dunia →
                    </Link>
                  </div>
                </article>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ rewards */

function Rewards() {
  return (
    <section id="ganjaran" className="relative mx-auto max-w-7xl px-5 py-28 sm:px-6">
      <SectionTitle kicker="SISTEM GANJARAN" title="Usaha dibalas" highlight="dengan ganjaran." text="Setiap jawapan betul membawa anak lebih dekat ke pangkat seterusnya, dan syiling boleh ditebus di kedai." />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {/* XP / mastery */}
        <Reveal className="lg:col-span-2">
          <div className="gl-neon-border relative h-full overflow-hidden rounded-2xl bg-[#0f0f22] p-6 sm:p-8">
            <p className="font-game text-xs font-bold tracking-[0.3em] text-violet-300">PANGKAT MASTERY</p>
            <h3 className="font-game mt-2 text-3xl font-bold uppercase text-white">Kuasai topik, naik pangkat</h3>
            <p className="mt-2 max-w-lg text-slate-400">Setiap topik yang dikuasai mengisi bar kemajuan. Misi memastikan anak kembali berlatih setiap hari.</p>
            <div className="mt-8 space-y-4">
              {[['Pecahan', 100, 'from-emerald-400 to-cyan-400'], ['Perpuluhan', 72, 'from-cyan-400 to-violet-500'], ['Peratus', 38, 'from-violet-500 to-fuchsia-500']].map(([topic, value, tone], index) => (
                <div key={topic}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-200">{topic}</span>
                    <span className="font-game font-bold text-slate-300">{value}%{value === 100 && <span className="ml-2 text-emerald-300">MASTERED</span>}</span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }} transition={{ duration: 1.3, delay: 0.2 + index * 0.15, ease }} className={`h-full rounded-full bg-gradient-to-r ${tone} shadow-[0_0_16px_rgba(139,92,246,.6)]`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Coins & shop */}
        <Reveal delay={0.1}>
          <div className="gl-neon-border relative flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/15 to-[#0f0f22] p-6 sm:p-8">
            <p className="font-game text-xs font-bold tracking-[0.3em] text-amber-300">SYILING & KEDAI</p>
            <h3 className="font-game mt-2 text-3xl font-bold uppercase text-white">Menang di Arena</h3>
            <p className="mt-2 text-slate-400">Kumpul syiling di Quiz Arena dan tebus tema serta ganjaran di kedai.</p>
            <img src={img('quiz-arena-celebrate')} alt="Kanak-kanak meraikan kemenangan Quiz Arena" loading="lazy" decoding="async" className="mx-auto mt-6 w-full max-w-xs drop-shadow-[0_20px_40px_rgba(245,158,11,.35)]" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ skins / themes */

function Skins() {
  const row = [...skins, ...skins];
  return (
    <section id="tema" className="relative overflow-hidden border-y border-white/10 bg-[#0b0b1a] py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <SectionTitle kicker="KOLEKSI TEMA" title="Pilih dunia" highlight="kegemaran anda." text="Buka tema baharu dengan syiling, lengkap dengan watak dan gaya kad tersendiri: Lego, robot, angkasa, kucing dan banyak lagi." />
      </div>
      <div className="gl-marquee mt-14 overflow-hidden">
        <div className="gl-marquee-track py-4" style={{ '--gl-speed': '60s', gap: '1.25rem' }}>
          {row.map(([slug, name, image], index) => (
            <figure key={`${slug}-${index}`} className="gl-neon-border group relative h-56 w-72 shrink-0 overflow-hidden rounded-2xl bg-[#12122a] sm:h-64 sm:w-80">
              <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-110 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b1a] via-transparent to-transparent" />
              {THEME_CHARACTERS[slug] && (
                <img src={THEME_CHARACTERS[slug]} alt="" loading="lazy" decoding="async" className="absolute -bottom-2 right-2 h-40 object-contain drop-shadow-2xl transition duration-500 group-hover:-translate-y-2 sm:h-44" />
              )}
              <figcaption className="font-game absolute bottom-4 left-4 text-lg font-bold uppercase text-white">{name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ parents */

function Parents() {
  return (
    <section id="ibubapa" className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-28 sm:px-6 lg:grid-cols-2">
      <SectionTitle kicker="MOD PENJAGA" title="Ibu bapa nampak" highlight="setiap kemajuan." text="Portal ibu bapa menunjukkan dashboard pembelajaran, kad laporan dan log sesi anak, jadi sokongan boleh diberi tepat pada masanya." />
      <Reveal delay={0.1}>
        <div className="gl-neon-border rounded-2xl bg-[#0f0f22] p-6 shadow-[0_40px_80px_-40px_rgba(139,92,246,.6)] sm:p-8">
          <div className="flex items-center justify-between">
            <p className="font-game text-sm font-bold uppercase tracking-wider text-slate-300">Kad laporan</p>
            <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-[11px] font-bold text-emerald-300">Minggu ini ▲</span>
          </div>
          <div className="mt-5 space-y-2.5">
            {[['Matematik', 'A', 'text-emerald-300'], ['Sains', 'B+', 'text-cyan-300'], ['Bahasa Melayu', 'A-', 'text-emerald-300']].map(([subject, grade, tone]) => (
              <div key={subject} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-slate-300">{subject}</span>
                <span className={`font-game text-2xl font-bold ${tone}`}>{grade}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex h-20 items-end gap-2">
            {[35, 55, 42, 70, 58, 86, 78].map((height, index) => (
              <motion.span key={index} initial={{ height: 0 }} whileInView={{ height: `${height}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 + index * 0.07, ease }} className="flex-1 rounded-t-md bg-gradient-to-t from-violet-600 to-cyan-400" />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ final CTA + footer */

function PressStart() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-700/40 via-[#0f0f22] to-cyan-700/30 px-6 py-16 text-center sm:px-16">
        <div aria-hidden className="gl-grid-floor absolute inset-x-[-20%] bottom-0 h-2/3 opacity-50" />
        <motion.img
          src={img('robo')}
          alt="Maskot robot HomeTutor"
          loading="lazy"
          decoding="async"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mx-auto w-36 drop-shadow-[0_0_40px_rgba(34,211,238,.45)] sm:w-44"
        />
        <p className="font-game gl-blink relative mt-6 text-sm font-bold tracking-[0.4em] text-cyan-300">PRESS START</p>
        <h2 className="font-game relative mt-3 text-4xl font-bold uppercase leading-tight text-white sm:text-6xl">
          Misi pertama <span className="gl-neon-text">menanti.</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-lg text-lg text-slate-300">Daftar akaun ibu bapa, tambah anak dan pilih pakej. Anak boleh terus mula berlatih dan bermain.</p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <StartButton href={route('register')}>Daftar sekarang</StartButton>
          <GhostButton href={route('login')}>Log masuk</GhostButton>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070712]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-slate-500 sm:flex-row">
        <div className="flex items-center gap-3">
          <img src={img('ht-logo')} alt="HomeTutor" className="h-8 w-auto rounded-md bg-white/95 px-1.5 py-0.5" />
          <span>© {new Date().getFullYear()} HomeTutor Malaysia</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5">
          <a href="#mod" className="hover:text-white">Mod</a>
          <a href="#dunia" className="hover:text-white">Dunia</a>
          <Link href={route('login')} className="hover:text-white">Log masuk</Link>
          <a href="https://hometutor.com.my/" target="_blank" rel="noreferrer" className="hover:text-white">Laman rasmi</a>
          <a href="#top" className="hover:text-white">Ke atas ↑</a>
        </nav>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ page */

export default function PracticeGameLanding() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <>
      <Head title="HomeTutor Practice | Belajar. Main. Naik level.">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=chakra-petch:500,600,700|plus-jakarta-sans:400,500,600,700&display=swap" rel="stylesheet" />
        <meta name="description" content="HomeTutor Practice: latihan Tahun 1 hingga Tingkatan 5 seperti permainan. Semakan segera, misi, pangkat mastery, Quiz Arena, HomeTutor Play dan laporan untuk ibu bapa." />
        <meta name="theme-color" content="#070712" />
      </Head>
      <div className="game-landing min-h-screen bg-[#070712] text-slate-100 antialiased selection:bg-fuchsia-500 selection:text-white">
        <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500" />
        <Nav />
        <main>
          <Hero />
          <Ticker />
          <Modes />
          <Worlds />
          <Rewards />
          <Skins />
          <Parents />
          <PressStart />
        </main>
        <Footer />
      </div>
    </>
  );
}
