import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BanknotesIcon, BoltIcon, GiftIcon, TrophyIcon } from '@heroicons/react/24/outline';
import SmoothScroll from '@/Components/SmoothScroll';
import { Aurora, BlurText, Card3D, ease, GridPattern, Magnetic, Marquee, Meteors, ShinyText, SpotlightCard, StickyScroll } from '@/Components/PracticeLanding/Effects';
import '../../css/practice-landing.css';

// three.js loads after the text so the page is readable straight away.
const HeroScene = lazy(() => import('@/Components/PracticeLanding/HeroScene'));
const VantaWaves = lazy(() => import('@/Components/PracticeLanding/VantaWaves'));

const img = (name) => `/images/landing-practice/${name}.webp`;

const subjectsA = ['Matematik', 'Sains', 'Bahasa Melayu', 'Bahasa Inggeris', 'Sejarah', 'Pendidikan Islam'];
const subjectsB = ['Matematik Tambahan', 'Fizik', 'Kimia', 'Biologi', 'Pendidikan Moral', 'Teka Kata'];
const dots = ['bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500'];

const levels = [
    { name: 'Tahun 1 – 3', stage: 'Sekolah rendah · Tahap 1', img: img('level-standard1-3') },
    { name: 'Tahun 4 – 6', stage: 'Sekolah rendah · Tahap 2', img: img('level-standard4-6') },
    { name: 'Tingkatan 1 – 3', stage: 'Menengah rendah', img: img('level-form1-3') },
    { name: 'Tingkatan 4 – 5', stage: 'Menengah atas', img: img('level-form4-5') },
];

const playGames = ['Boss Battle', 'Tembak Jawapan', 'Puzzle', 'Memory Cards', 'Matching Pairs', 'Sorting', 'Susun Urutan', 'Bina Suku Kata', 'Sentence Builder', 'Hotspot', 'Tracing'];

/* ---------------------------------------------------------------- shared bits */

function Reveal({ children, delay = 0, className = '', y = 28 }) {
    return (
        <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.8, delay, ease }} className={className}>
            {children}
        </motion.div>
    );
}

function SectionHeading({ eyebrow, title, highlight, text, center = false }) {
    return (
        <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                {eyebrow}
            </motion.p>
            <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl">
                <BlurText text={title} /> {highlight && <BlurText text={highlight} delay={0.25} wordClassName="text-spectrum" />}
            </h2>
            {text && (
                <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-5 text-lg leading-relaxed text-slate-600">
                    {text}
                </motion.p>
            )}
        </div>
    );
}

function PrimaryButton({ href, children, className = '' }) {
    return (
        <Magnetic>
            <Link href={href} className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-900 px-7 py-3.5 font-semibold text-white shadow-[0_8px_24px_-6px_rgba(15,23,42,.45)] transition hover:bg-slate-800 ${className}`}>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{children}</span>
                <span className="relative transition-transform group-hover:translate-x-1">→</span>
            </Link>
        </Magnetic>
    );
}

function Check({ className = 'bg-blue-50 text-blue-600' }) {
    return <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${className}`}>✓</span>;
}

/* ---------------------------------------------------------------- nav */

function Nav() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const on = () => setScrolled(window.scrollY > 24);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);
    const links = [['Ciri', '#ciri'], ['Cara belajar', '#cara'], ['HomeTutor Play', '#play'], ['Quiz Arena', '#arena'], ['Tahap', '#tahap']];

    return (
        <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease }} className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
            <nav className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-3 py-2 transition-all duration-500 ${scrolled || open ? 'border-slate-200/80 bg-white/85 shadow-[0_8px_30px_-12px_rgba(15,23,42,.18)] backdrop-blur-xl' : 'border-transparent'}`}>
                <a href="#top" className="flex items-center gap-2 rounded-xl px-1.5 py-1">
                    <img src={img('ht-logo')} alt="HomeTutor" className="h-10 w-auto" />
                </a>
                <div className="hidden items-center gap-1 lg:flex">
                    {links.map(([label, href]) => (
                        <a key={href} href={href} className="rounded-full px-3.5 py-2 text-[15px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">{label}</a>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route('login')} className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900 sm:inline-flex">Log masuk</Link>
                    <Link href={route('register')} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Daftar</Link>
                    <button type="button" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-700 lg:hidden">
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
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto mt-2 max-w-6xl rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur-xl lg:hidden">
                        {links.map(([label, href]) => (
                            <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-50">{label}</a>
                        ))}
                        <Link href={route('login')} className="block rounded-xl px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50">Log masuk</Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}

/* ---------------------------------------------------------------- hero + 3D scene */

function Hero() {
    const reduced = useReducedMotion();
    const sectionRef = useRef(null);

    return (
        <section id="top" ref={sectionRef} className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden bg-white pb-16 pt-32 sm:pt-36">
            <Aurora />
            <GridPattern />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, delay: 0.3, ease }} className="absolute inset-0">
                <Suspense fallback={null}>
                    <HeroScene eventSource={sectionRef} reduced={reduced} />
                </Suspense>
            </motion.div>
            <div className="pointer-events-none relative mx-auto max-w-4xl px-6 text-center [&_a]:pointer-events-auto">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease }} className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 py-1.5 pl-1.5 pr-4 text-sm shadow-sm backdrop-blur">
                    <span className="bg-spectrum rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Baharu</span>
                    <ShinyText className="font-medium">HomeTutor Practice · Tahun 1 hingga Tingkatan 5</ShinyText>
                </motion.div>
                <h1 className="font-display text-5xl font-extrabold leading-[1.04] text-slate-900 sm:text-6xl lg:text-7xl">
                    <BlurText text="Satu platform." delay={0.2} />
                    <br />
                    <BlurText text="Setiap potensi bersinar." delay={0.45} wordClassName="text-spectrum" />
                </h1>
                <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.8, ease }} className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                    Latihan ikut subjek dengan semakan serta-merta, pangkat mastery, Quiz Arena dan permainan HomeTutor Play. Ibu bapa pula nampak perkembangan anak dalam satu laporan.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 1, ease }} className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    <PrimaryButton href={route('register')}>Mula sekarang</PrimaryButton>
                    <a href="#play" className="rounded-full border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">Terokai HomeTutor Play</a>
                </motion.div>
            </div>

            <div className="pointer-events-none relative mx-auto mt-20 grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-5 px-6 md:grid-cols-4">
                {[['Tahun 1 – Tingkatan 5', 'Pakej ikut tahap'], ['Semakan serta-merta', 'Objektif & subjektif'], ['Portal ibu bapa', 'Dashboard & kad laporan'], ['HomeTutor Play', 'Satu akaun, dua platform']].map(([t, s], i) => (
                    <Reveal key={t} delay={0.9 + i * 0.06} y={16} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur">
                        <Check />
                        <div>
                            <p className="font-semibold text-slate-900">{t}</p>
                            <p className="text-sm text-slate-500">{s}</p>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- features */

function FeatureIcon({ children, className = 'bg-blue-50 text-blue-600' }) {
    return <span className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-bold ${className}`}>{children}</span>;
}

function MiniBars({ from = 'from-emerald-500', to = 'to-emerald-300' }) {
    const bars = [40, 62, 48, 75, 58, 88];
    return (
        <div className="mt-5 flex h-16 items-end gap-2">
            {bars.map((h, i) => (
                <motion.span key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease }} className={`flex-1 rounded-t-md bg-gradient-to-t ${from} ${to}`} />
            ))}
        </div>
    );
}

function QuestionMock({ compact = false }) {
    return (
        <div className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${compact ? 'p-4' : 'p-5'}`}>
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">Matematik · Algebra</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">Disemak</span>
            </div>
            <p className="mt-3 font-display text-xl font-bold text-slate-900 sm:text-2xl">Selesaikan: 3x + 4 = 19</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {['x = 5', 'x = 7', 'x = 9', 'x = 11'].map((a, i) => (
                    <div key={a} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold ${i === 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                        {a}{i === 0 && <span>✓</span>}
                    </div>
                ))}
            </div>
            <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">Betul! 3x = 15, jadi x = 5.</div>
        </div>
    );
}

function Features() {
    return (
        <section id="ciri" className="relative mx-auto max-w-7xl px-6 py-28">
            <SectionHeading eyebrow="Ciri-ciri" title="Semua yang anak perlukan" highlight="untuk terus maju." text="Satu platform untuk berlatih, mengulang kaji dan kekal bermotivasi, dengan ibu bapa sentiasa dalam gambaran." />
            <div className="mt-14 grid auto-rows-[minmax(14rem,auto)] gap-5 md:grid-cols-3">
                <Reveal className="md:col-span-2 md:row-span-2">
                    <SpotlightCard className="h-full">
                        <div className="grid h-full gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_1.1fr] lg:items-center">
                            <div>
                                <FeatureIcon>✎</FeatureIcon>
                                <h3 className="mt-5 font-display text-2xl font-bold text-slate-900 sm:text-3xl">Latihan objektif & subjektif, disemak serta-merta.</h3>
                                <p className="mt-3 text-slate-600">Anak tahu jawapan betul atau salah sebaik sahaja menjawab, dan boleh ulang kaji setiap sesi selepas tamat.</p>
                                <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                                    {['Topik dan subtopik yang tersusun', 'Ringkasan dan ulang kaji sesi', 'Laporkan soalan yang bermasalah'].map((t) => (
                                        <li key={t} className="flex items-center gap-2.5"><Check />{t}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="transition duration-500 group-hover:-translate-y-1"><QuestionMock /></div>
                        </div>
                    </SpotlightCard>
                </Reveal>
                <Reveal delay={0.08}>
                    <SpotlightCard className="h-full p-7" glow="rgba(245,158,11,.10)" edge="rgba(245,158,11,.6)">
                        <FeatureIcon className="bg-amber-50 text-amber-600">★</FeatureIcon>
                        <h3 className="mt-5 font-display text-xl font-bold text-slate-900">Misi & pangkat mastery</h3>
                        <p className="mt-2 text-slate-600">Selesaikan misi topik dan naikkan pangkat bila kemahiran dikuasai.</p>
                    </SpotlightCard>
                </Reveal>
                <Reveal delay={0.16}>
                    <SpotlightCard className="h-full p-7" glow="rgba(219,39,119,.08)" edge="rgba(219,39,119,.55)">
                        <FeatureIcon className="bg-pink-50 text-pink-600">⚑</FeatureIcon>
                        <h3 className="mt-5 font-display text-xl font-bold text-slate-900">Rakan & cabaran</h3>
                        <p className="mt-2 text-slate-600">Tambah rakan dan bersaing di papan pendahulu Quiz Arena.</p>
                    </SpotlightCard>
                </Reveal>
                <Reveal delay={0.08}>
                    <SpotlightCard className="h-full p-7" glow="rgba(16,185,129,.10)" edge="rgba(16,185,129,.55)">
                        <FeatureIcon className="bg-emerald-50 text-emerald-600">▤</FeatureIcon>
                        <h3 className="mt-5 font-display text-xl font-bold text-slate-900">Laporan untuk ibu bapa</h3>
                        <p className="mt-2 text-slate-600">Dashboard pembelajaran dan kad laporan anak dalam portal ibu bapa.</p>
                        <MiniBars />
                    </SpotlightCard>
                </Reveal>
                <Reveal delay={0.16}>
                    <SpotlightCard className="h-full p-7" glow="rgba(124,58,237,.10)" edge="rgba(124,58,237,.55)">
                        <FeatureIcon className="bg-violet-50 text-violet-600">◐</FeatureIcon>
                        <h3 className="mt-5 font-display text-xl font-bold text-slate-900">Tema pilihan sendiri</h3>
                        <p className="mt-2 text-slate-600">Angkasa, lautan, hutan dan banyak lagi. Belajar dalam dunia kegemaran.</p>
                        <div className="mt-5 flex -space-x-3">
                            {['theme-space', 'theme-ocean', 'theme-jungle', 'theme-candy'].map((t) => (
                                <img key={t} src={img(t)} alt="" loading="lazy" decoding="async" className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-sm transition group-hover:-translate-y-1" />
                            ))}
                        </div>
                    </SpotlightCard>
                </Reveal>
                <Reveal delay={0.24}>
                    <SpotlightCard className="h-full p-7" glow="rgba(14,165,233,.10)" edge="rgba(14,165,233,.55)">
                        <FeatureIcon className="bg-sky-50 text-sky-600">⌗</FeatureIcon>
                        <h3 className="mt-5 font-display text-xl font-bold text-slate-900">Alat bantu belajar</h3>
                        <p className="mt-2 text-slate-600">Kalkulator saintifik, kamus dan alat lukis terus dalam halaman soalan.</p>
                    </SpotlightCard>
                </Reveal>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- how it works */

function MockFrame({ title, children }) {
    return (
        <div className="flex h-full flex-col rounded-3xl border border-white bg-white/90 p-5 shadow-[0_30px_70px_-30px_rgba(37,99,235,.35)] ring-1 ring-slate-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-amber-300" /><span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-sm font-medium text-slate-500">{title}</span>
            </div>
            <div className="flex flex-1 flex-col justify-center py-6">{children}</div>
        </div>
    );
}

const steps = [
    {
        title: 'Pilih subjek & topik',
        text: 'Mulakan dari subjek yang ingin dikuasai. Setiap subjek dipecahkan kepada topik dan subtopik yang jelas.',
        visual: (
            <MockFrame title="Pilih subjek">
                <div className="grid grid-cols-2 gap-3">
                    {['Matematik', 'Sains', 'Bahasa Melayu', 'Bahasa Inggeris'].map((s, i) => (
                        <div key={s} className={`rounded-2xl border p-4 ${i === 0 ? 'border-blue-300 bg-blue-50/60 ring-4 ring-blue-50' : 'border-slate-200 bg-white'}`}>
                            <span className={`block h-2 w-8 rounded-full ${dots[i]}`} />
                            <p className="mt-4 font-display font-bold text-slate-900">{s}</p>
                            <p className="mt-1 text-xs text-slate-500">Topik & subtopik</p>
                        </div>
                    ))}
                </div>
            </MockFrame>
        ),
    },
    {
        title: 'Berlatih & semak serta-merta',
        text: 'Jawab soalan objektif atau subjektif. Jawapan disemak terus supaya anak tahu di mana silapnya, bukan esok.',
        visual: <MockFrame title="Soalan 08 / 10"><QuestionMock compact /></MockFrame>,
    },
    {
        title: 'Kuasai kemahiran',
        text: 'Setiap topik yang dikuasai menaikkan pangkat mastery. Misi memastikan anak kembali berlatih.',
        visual: (
            <MockFrame title="Mastery">
                <div className="flex flex-col items-center gap-8 sm:flex-row">
                    <div className="relative h-36 w-36 shrink-0">
                        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                            <motion.circle cx="60" cy="60" r="50" fill="none" stroke="url(#pl-ring)" strokeWidth="12" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 0.75 }} viewport={{ once: true }} transition={{ duration: 1.6, ease }} />
                            <defs><linearGradient id="pl-ring"><stop offset="0" stopColor="#2563eb" /><stop offset="1" stopColor="#db2777" /></linearGradient></defs>
                        </svg>
                        <span className="absolute inset-0 grid place-items-center font-display text-3xl font-extrabold text-slate-900">75%</span>
                    </div>
                    <div className="space-y-3">
                        {['Pecahan', 'Perpuluhan', 'Peratus'].map((s, i) => (
                            <div key={s}>
                                <div className="flex justify-between text-sm"><span className="text-slate-700">{s}</span><span className="text-amber-500">{['★★★', '★★☆', '★☆☆'][i]}</span></div>
                                <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} whileInView={{ width: `${[100, 66, 33][i]}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }} className="h-full rounded-full bg-gradient-to-r from-blue-600 to-pink-500" /></div>
                            </div>
                        ))}
                    </div>
                </div>
            </MockFrame>
        ),
    },
    {
        title: 'Ibu bapa pantau perkembangan',
        text: 'Portal ibu bapa menunjukkan dashboard pembelajaran dan kad laporan anak, jadi sokongan boleh diberi tepat pada masanya.',
        visual: (
            <MockFrame title="Portal ibu bapa · Kad laporan">
                <div className="space-y-3">
                    {[['Matematik', 'A', 'text-emerald-600'], ['Sains', 'B+', 'text-blue-600'], ['Bahasa Melayu', 'A-', 'text-emerald-600']].map(([s, g, c]) => (
                        <div key={s} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                            <span className="text-slate-700">{s}</span><span className={`font-display text-xl font-extrabold ${c}`}>{g}</span>
                        </div>
                    ))}
                </div>
                <MiniBars from="from-blue-600" to="to-violet-400" />
            </MockFrame>
        ),
    },
];

function HowItWorks() {
    return (
        <section id="cara" className="relative isolate bg-[#eef3ff]">
            {/* The waves are pinned to one screen height while the tall section scrolls past them. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="sticky top-0 h-[100svh] overflow-hidden">
                    <Suspense fallback={null}>
                        <VantaWaves className="h-full w-full" color={0xb4c8ff} fallback="#eef3ff" ambientBoost={Math.PI} />
                    </Suspense>
                    <div className="pl-rainbow-tint" />
                    {/* Soften the waves behind the step text so it stays readable. */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/25 to-transparent" />
                </div>
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
            </div>
            <div className="mx-auto max-w-7xl px-6 py-24">
                <SectionHeading eyebrow="Cara belajar" title="Empat langkah," highlight="satu rutin yang menjadi." />
                <div className="mt-6"><StickyScroll items={steps} /></div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- HomeTutor Play */

function PlaySection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const yMain = useTransform(scrollYProgress, [0, 1], [60, -60]);
    const yA = useTransform(scrollYProgress, [0, 1], [120, -120]);
    const yB = useTransform(scrollYProgress, [0, 1], [-40, 90]);
    const yOwl = useTransform(scrollYProgress, [0, 1], [90, -50]);

    return (
        <section id="play" ref={ref} className="relative px-4 py-28 sm:px-6">
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-amber-50 px-6 py-16 sm:px-12 lg:py-20">
                <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl" />
                <div aria-hidden className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
                <div className="relative grid items-center gap-14 lg:grid-cols-2">
                    <div>
                        <Reveal>
                            <img src={img('play-logo')} alt="HomeTutor Play" className="h-12 w-auto" />
                        </Reveal>
                        <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl">
                            <BlurText text="Belajar sambil bermain," /> <BlurText text="dengan akaun yang sama." delay={0.25} wordClassName="bg-gradient-to-r from-violet-700 to-fuchsia-700 bg-clip-text text-transparent" />
                        </h2>
                        <Reveal delay={0.1}>
                            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                                HomeTutor Play ialah platform permainan pembelajaran interaktif. Log masuk sekali di HomeTutor, kemudian terus ke dunia permainan tanpa kata laluan baharu.
                            </p>
                        </Reveal>
                        <ul className="mt-8 space-y-3.5">
                            {[
                                ['14 jenis permainan', 'Kuiz aksi, arked, puzzle, padanan, susunan dan menulis.'],
                                ['Satu log masuk', 'Akaun HomeTutor yang sama, disambung secara selamat melalui SSO.'],
                                ['Kandungan sentiasa bertambah', 'Permainan baharu dibina melalui pembina permainan tanpa kod.'],
                            ].map(([t, s], i) => (
                                <Reveal key={t} delay={0.15 + i * 0.07} y={16}>
                                    <li className="flex gap-3">
                                        <Check className="bg-violet-100 text-violet-700" />
                                        <div><p className="font-semibold text-slate-900">{t}</p><p className="text-sm text-slate-600">{s}</p></div>
                                    </li>
                                </Reveal>
                            ))}
                        </ul>
                        <Reveal delay={0.3} className="mt-9 flex flex-wrap items-center gap-3">
                            <Magnetic>
                                <Link href={route('games.play')} className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,.6)] transition hover:brightness-110">
                                    Buka HomeTutor Play <span className="transition-transform group-hover:translate-x-1">→</span>
                                </Link>
                            </Magnetic>
                            <span className="text-sm text-slate-500">Anda akan diminta log masuk dahulu.</span>
                        </Reveal>
                    </div>

                    <div className="relative h-[26rem] sm:h-[32rem]">
                        <motion.div style={{ y: yMain }} className="absolute left-[6%] top-[8%] w-[78%] overflow-hidden rounded-3xl border border-white bg-white p-2 shadow-[0_30px_70px_-25px_rgba(76,29,149,.45)]">
                            <img src={img('play-magic-game-hero')} alt="Perpustakaan permainan HomeTutor Play" loading="lazy" decoding="async" className="rounded-2xl" />
                        </motion.div>
                        <motion.div style={{ y: yA }} className="absolute -left-2 bottom-[4%] w-[38%] rotate-[-6deg] rounded-2xl border border-white bg-white p-1.5 shadow-xl">
                            <img src={img('play-puzzle-sistem-suria')} alt="Puzzle sistem suria" loading="lazy" decoding="async" className="rounded-xl" />
                            <p className="px-1.5 pb-1 pt-2 text-xs font-bold text-slate-800">Puzzle</p>
                        </motion.div>
                        <motion.div style={{ y: yB }} className="absolute right-0 top-0 w-[32%] rotate-[5deg] rounded-2xl border border-white bg-gradient-to-br from-violet-700 to-pink-600 p-1.5 shadow-xl">
                            <img src={img('play-boss-battle')} alt="Boss Battle" loading="lazy" decoding="async" className="rounded-xl" />
                            <p className="px-1.5 pb-1 pt-2 text-xs font-bold text-white">Boss Battle</p>
                        </motion.div>
                        <motion.img style={{ y: yOwl }} src={img('play-owl')} alt="Maskot burung hantu HomeTutor Play" loading="lazy" decoding="async" className="absolute bottom-[-4%] right-[2%] w-[34%] drop-shadow-[0_20px_30px_rgba(76,29,149,.35)]" />
                    </div>
                </div>
                <div className="relative mt-14">
                    <Marquee speed={50}>
                        {playGames.map((g) => (
                            <span key={g} className="whitespace-nowrap rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-900 shadow-sm">{g}</span>
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- Quiz Arena */

const arenaFeatures = [
    { title: 'Syiling & dompet', text: 'Setiap jawapan betul menambah syiling dalam dompet anak.', icon: BanknotesIcon, tone: 'from-amber-400 to-orange-500', glow: 'rgba(245,158,11,.10)', edge: 'rgba(245,158,11,.55)' },
    { title: 'Kedai ganjaran', text: 'Tebus syiling dengan tema dan ganjaran pilihan.', icon: GiftIcon, tone: 'from-pink-500 to-rose-500', glow: 'rgba(236,72,153,.08)', edge: 'rgba(236,72,153,.55)' },
    { title: 'Papan pendahulu', text: 'Naik kedudukan dan bersaing secara sihat.', icon: TrophyIcon, tone: 'from-blue-500 to-indigo-600', glow: 'rgba(37,99,235,.10)', edge: 'rgba(37,99,235,.55)' },
    { title: 'Cabar rakan', text: 'Hantar cabaran kuiz dan lihat siapa menang.', icon: BoltIcon, tone: 'from-violet-500 to-purple-600', glow: 'rgba(124,58,237,.10)', edge: 'rgba(124,58,237,.55)' },
];

const leaders = [['Aisyah', 1280, 'bg-amber-400'], ['Daniel', 1145, 'bg-slate-300'], ['Mei Ling', 990, 'bg-orange-300']];

/** Small frosted card floating over the arena artwork. */
function GlassChip({ children, className = '', style }) {
    return (
        <motion.div style={style} className={`absolute rounded-2xl border border-white/70 bg-white/80 p-3 shadow-[0_20px_40px_-18px_rgba(30,64,175,.45)] backdrop-blur-xl ${className}`}>
            {children}
        </motion.div>
    );
}

function Arena() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const yKids = useTransform(scrollYProgress, [0, 1], [40, -30]);
    const yBoard = useTransform(scrollYProgress, [0, 1], [60, -60]);
    const yCoin = useTransform(scrollYProgress, [0, 1], [-30, 50]);

    return (
        <section id="arena" ref={ref} className="relative isolate overflow-hidden bg-gradient-to-b from-white via-sky-50/70 to-white">
            <GridPattern />
            <div aria-hidden className="absolute -left-32 top-24 -z-10 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
            <div aria-hidden className="absolute -right-24 bottom-10 -z-10 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-32 pt-24 lg:grid-cols-2">
                <Reveal className="relative order-2 lg:order-1">
                    <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_90px_-35px_rgba(30,64,175,.45)] ring-1 ring-slate-900/5">
                        <motion.img style={{ y }} src={img('quiz-arena-realm')} alt="Dunia Quiz Arena di atas awan" loading="lazy" decoding="async" className="h-[22rem] w-full scale-125 object-cover sm:h-[28rem]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                    </div>

                    {/* Mini leaderboard */}
                    <GlassChip style={{ y: yBoard }} className="-right-2 top-6 w-44 sm:-right-6 sm:w-56">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"><TrophyIcon className="h-3.5 w-3.5 text-amber-500" /> Papan pendahulu</p>
                        <ul className="mt-2 space-y-1.5">
                            {leaders.map(([name, pts, medal], i) => (
                                <li key={name} className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm ${i === 0 ? 'bg-amber-50' : ''}`}>
                                    <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white ${medal}`}>{i + 1}</span>
                                    <span className="flex-1 truncate font-semibold text-slate-800">{name}</span>
                                    <span className="text-xs font-bold tabular-nums text-slate-500">{pts}</span>
                                </li>
                            ))}
                        </ul>
                    </GlassChip>

                    {/* Coin reward pop */}
                    <GlassChip style={{ y: yCoin }} className="-left-2 top-1/3 flex items-center gap-2.5 pr-4 sm:-left-6">
                        <motion.span animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-base font-extrabold text-amber-900 shadow-inner">★</motion.span>
                        <div>
                            <p className="font-display text-lg font-extrabold leading-none text-slate-900">+50</p>
                            <p className="text-xs font-medium text-slate-500">syiling dikumpul</p>
                        </div>
                    </GlassChip>

                    {/* x is set through Motion: its inline transform would override a Tailwind translate class. */}
                    <motion.img style={{ y: yKids, x: '-50%' }} src={img('quiz-arena-celebrate')} alt="Kanak-kanak meraikan kemenangan Quiz Arena" loading="lazy" decoding="async" className="absolute -bottom-10 left-1/2 w-[78%] drop-shadow-2xl" />
                </Reveal>

                <div className="order-1 lg:order-2">
                    <SectionHeading eyebrow="Quiz Arena" title="Latihan jadi" highlight="pertandingan yang sihat." text="Jawab soalan untuk kumpul syiling, naik papan pendahulu, cabar rakan dan tebus ganjaran di kedai." />
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                        {arenaFeatures.map(({ title, text, icon: Icon, tone, glow, edge }, i) => (
                            <Reveal key={title} delay={0.1 + i * 0.06} y={14}>
                                <SpotlightCard className="h-full p-5" glow={glow} edge={edge}>
                                    <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg shadow-slate-900/10 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 ${tone}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{title}</h3>
                                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{text}</p>
                                </SpotlightCard>
                            </Reveal>
                        ))}
                    </div>
                    <Reveal delay={0.35} className="mt-8">
                        <PrimaryButton href={route('register')}>Cuba Quiz Arena</PrimaryButton>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- levels */

function Levels() {
    return (
        <section id="tahap" className="relative mx-auto max-w-7xl px-6 py-28">
            <SectionHeading eyebrow="Tahap" title="Dari Tahun 1" highlight="hingga Tingkatan 5." text="Pilih pakej ikut tahap persekolahan anak." center />
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {levels.map((l, i) => (
                    <Reveal key={l.name} delay={i * 0.08}>
                        <Card3D className="relative rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_18px_40px_-20px_rgba(15,23,42,.25)]">
                            <div data-depth="1" className="overflow-hidden rounded-2xl">
                                <img src={l.img} alt={`Murid ${l.name}`} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
                            </div>
                            <div className="px-2 pb-2">
                                <p data-depth="2" className="mt-5 font-display text-2xl font-extrabold text-slate-900">{l.name}</p>
                                <p data-depth="1" className="mt-1 text-sm text-slate-500">{l.stage}</p>
                                <Link data-depth="3" href={route('register')} className="mt-5 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white">
                                    Mula →
                                </Link>
                            </div>
                        </Card3D>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- CTA + footer */

function FinalCta() {
    return (
        <section className="px-4 pb-24 sm:px-6">
            <Reveal className="pl-dark relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-8 py-16 sm:px-16">
                <Meteors />
                <div aria-hidden className="bg-spectrum absolute -top-px left-0 h-px w-full opacity-80" />
                <div aria-hidden className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
                <div aria-hidden className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-pink-600/25 blur-3xl" />
                <div className="relative grid items-center gap-10 md:grid-cols-[1fr_auto]">
                    <div>
                        <h2 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl">
                            <BlurText text="Mula latihan pertama" /><br /><BlurText text="hari ini." delay={0.3} wordClassName="text-spectrum" />
                        </h2>
                        <p className="mt-5 max-w-lg text-lg text-slate-300">Daftar akaun ibu bapa, tambah anak dan pilih pakej. Anak boleh terus mula berlatih dan bermain.</p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Magnetic>
                                <Link href={route('register')} className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-100">Daftar sekarang →</Link>
                            </Magnetic>
                            <Link href={route('login')} className="rounded-full border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">Log masuk</Link>
                        </div>
                    </div>
                    <motion.img src={img('robo')} alt="Maskot robot HomeTutor melambai" loading="lazy" decoding="async" animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="mx-auto w-48 drop-shadow-[0_0_40px_rgba(56,189,248,.35)] sm:w-60" />
                </div>
            </Reveal>
        </section>
    );
}

function Footer() {
    const cols = [
        ['Produk', [['HomeTutor Practice', '#top'], ['HomeTutor Play', '#play'], ['Quiz Arena', '#arena'], ['Tahap & pakej', '#tahap']]],
        ['Akaun', [['Log masuk', route('login')], ['Daftar', route('register')]]],
        ['HomeTutor', [['Laman rasmi', 'https://hometutor.com.my/']]],
    ];
    return (
        <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
                <div>
                    <img src={img('ht-logo')} alt="HomeTutor" className="h-12 w-auto" />
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">Latihan, permainan dan laporan pembelajaran untuk murid Tahun 1 hingga Tingkatan 5.</p>
                </div>
                {cols.map(([title, items]) => (
                    <div key={title}>
                        <p className="text-sm font-semibold text-slate-900">{title}</p>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {items.map(([label, href]) => (
                                <li key={label}>
                                    <a href={href} {...(href.startsWith('http') && !href.includes(window.location.host) ? { target: '_blank', rel: 'noreferrer' } : {})} className="text-slate-500 transition hover:text-slate-900">{label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-slate-100">
                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row">
                    <p>© {new Date().getFullYear()} HomeTutor Malaysia. Hak cipta terpelihara.</p>
                    <a href="#top" className="hover:text-slate-700">Kembali ke atas ↑</a>
                </div>
            </div>
        </footer>
    );
}

/* ---------------------------------------------------------------- page */

function PracticeLandingPage() {
    const { scrollYProgress } = useScroll();
    const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

    return (
        <div className="practice-landing relative min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
            <motion.div style={{ scaleX: bar }} className="bg-spectrum fixed inset-x-0 top-0 z-[60] h-[3px] origin-left" />
            <Nav />
            <main>
                <Hero />
                <div className="space-y-4 py-6">
                    <Marquee speed={45}>{subjectsA.map((s, i) => <SubjectPill key={s} name={s} i={i} />)}</Marquee>
                    <Marquee speed={55} reverse>{subjectsB.map((s, i) => <SubjectPill key={s} name={s} i={i + 2} />)}</Marquee>
                </div>
                <Features />
                <HowItWorks />
                <PlaySection />
                <Arena />
                <Levels />
                <FinalCta />
            </main>
            <Footer />
        </div>
    );
}

function SubjectPill({ name, i }) {
    return (
        <span className="flex items-center gap-3 whitespace-nowrap rounded-full border border-slate-200 bg-white px-5 py-2.5 font-display text-base font-semibold text-slate-700 shadow-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${dots[i % dots.length]}`} />{name}
        </span>
    );
}

export default function PracticeLanding() {
    return (
        <>
            <Head title="HomeTutor Practice | Latihan pintar untuk murid">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:500,600,700,800&display=swap" rel="stylesheet" />
                <meta name="description" content="HomeTutor Practice: latihan subjek Tahun 1 hingga Tingkatan 5 dengan semakan segera, mastery, Quiz Arena, HomeTutor Play dan laporan untuk ibu bapa." />
            </Head>
            <SmoothScroll>
                <PracticeLandingPage />
            </SmoothScroll>
        </>
    );
}
