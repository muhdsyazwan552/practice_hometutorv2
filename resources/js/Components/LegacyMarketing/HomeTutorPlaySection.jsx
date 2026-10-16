import useMarketingCopy from './useMarketingCopy';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { BlurText, Magnetic, Marquee, ease } from '@/Components/PracticeLanding/Effects';
import '../../../css/restored-play.css';

const img = name => `/images/landing-practice/${name}.webp`;
const playGames = ['Boss Battle', 'Tembak Jawapan', 'Puzzle', 'Memory Cards', 'Matching Pairs', 'Sorting', 'Susun Urutan', 'Bina Suku Kata', 'Sentence Builder', 'Hotspot', 'Tracing'];

function Reveal({ children, delay = 0, className = '', y = 28 }) {
    const reduceMotion = useReducedMotion();
    return <motion.div initial={reduceMotion ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: reduceMotion ? 0 : .8, delay: reduceMotion ? 0 : delay, ease }} className={className}>{children}</motion.div>;
}
function Check({ className }) { return <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${className}`}>✓</span>; }
function PlayText({ text, reduceMotion, wordClassName = '', ...props }) { return reduceMotion ? <span className={wordClassName}>{text}</span> : <BlurText text={text} wordClassName={wordClassName} {...props} />; }
function MotionButton({ children, reduceMotion }) { return reduceMotion ? children : <Magnetic>{children}</Magnetic>; }

// Restored from the original landing backup, including its copy and artwork.
export default function HomeTutorPlaySection() {
    const { t } = useMarketingCopy();
    const ref = useRef(null);
    const reduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const yMain = useTransform(scrollYProgress, [0, 1], [60, -60]);
    const yA = useTransform(scrollYProgress, [0, 1], [120, -120]);
    const yB = useTransform(scrollYProgress, [0, 1], [-40, 90]);
    const yOwl = useTransform(scrollYProgress, [0, 1], [90, -50]);

    return (
        <section id="play" ref={ref} className="restored-home-play relative px-4 py-28 sm:px-6">
            <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-amber-50 px-6 py-16 sm:px-12 lg:py-20">
                <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-200/50 blur-3xl" />
                <div aria-hidden className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
                <div className="relative grid items-center gap-14 lg:grid-cols-2">
                    <div>
                        <Reveal>
                            <img src={img('play-logo')} alt={t('HomeTutor Play')} className="h-12 w-auto" />
                        </Reveal>
                        <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] text-slate-900 sm:text-5xl">
                            <PlayText text={t('Belajar sambil bermain,')} reduceMotion={reduceMotion} /> <PlayText text={t('dengan akaun yang sama.')} reduceMotion={reduceMotion} delay={0.25} wordClassName="bg-gradient-to-r from-violet-700 to-fuchsia-700 bg-clip-text text-transparent" />
                        </h2>
                        <Reveal delay={0.1}>
                            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                                {t('HomeTutor Play ialah platform permainan pembelajaran interaktif. Log masuk sekali di HomeTutor, kemudian terus ke dunia permainan tanpa kata laluan baharu.')}
                            </p>
                        </Reveal>
                        <ul className="mt-8 space-y-3.5">
                            {[
                                ['14 jenis permainan', 'Kuiz aksi, arked, puzzle, padanan, susunan dan menulis.'],
                                ['Satu log masuk', 'Akaun HomeTutor yang sama, disambung secara selamat melalui SSO.'],
                                ['Kandungan sentiasa bertambah', 'Permainan baharu dibina melalui pembina permainan tanpa kod.'],
                            ].map(([title, description], i) => (
                                <Reveal key={title} delay={0.15 + i * 0.07} y={16}>
                                    <li className="flex gap-3">
                                        <Check className="bg-violet-100 text-violet-700" />
                                        <div><p className="font-semibold text-slate-900">{t(title)}</p><p className="text-sm text-slate-600">{t(description)}</p></div>
                                    </li>
                                </Reveal>
                            ))}
                        </ul>
                        <Reveal delay={0.3} className="mt-9 flex flex-wrap items-center gap-3">
                            <MotionButton reduceMotion={reduceMotion}>
                                <Link href="/games/play" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,.6)] transition hover:brightness-110">
                                    {t('Buka HomeTutor Play')} <span className="transition-transform group-hover:translate-x-1">→</span>
                                </Link>
                            </MotionButton>
                            <span className="text-sm text-slate-500">{t('Anda akan diminta log masuk dahulu.')}</span>
                        </Reveal>
                    </div>

                    <div className="relative h-[26rem] sm:h-[32rem]">
                        <motion.div style={{ y: reduceMotion ? 0 : yMain }} className="absolute left-[6%] top-[8%] w-[78%] overflow-hidden rounded-3xl border border-white bg-white p-2 shadow-[0_30px_70px_-25px_rgba(76,29,149,.45)]">
                            <img src={img('play-magic-game-hero')} alt={t('Perpustakaan permainan HomeTutor Play')} loading="lazy" decoding="async" className="rounded-2xl" />
                        </motion.div>
                        <motion.div style={{ y: reduceMotion ? 0 : yA }} className="absolute -left-2 bottom-[4%] w-[38%] rotate-[-6deg] rounded-2xl border border-white bg-white p-1.5 shadow-xl">
                            <img src={img('play-puzzle-sistem-suria')} alt={t('Puzzle sistem suria')} loading="lazy" decoding="async" className="rounded-xl" />
                            <p className="px-1.5 pb-1 pt-2 text-xs font-bold text-slate-800">{t("Puzzle")}</p>
                        </motion.div>
                        <motion.div style={{ y: reduceMotion ? 0 : yB }} className="absolute right-0 top-0 w-[32%] rotate-[5deg] rounded-2xl border border-white bg-gradient-to-br from-violet-700 to-pink-600 p-1.5 shadow-xl">
                            <img src={img('play-boss-battle')} alt={t('Boss Battle')} loading="lazy" decoding="async" className="rounded-xl" />
                            <p className="px-1.5 pb-1 pt-2 text-xs font-bold text-white">{t("Boss Battle")}</p>
                        </motion.div>
                        <motion.img style={{ y: reduceMotion ? 0 : yOwl }} src={img('play-owl')} alt={t('Maskot burung hantu HomeTutor Play')} loading="lazy" decoding="async" className="absolute bottom-[-4%] right-[2%] w-[34%] drop-shadow-[0_20px_30px_rgba(76,29,149,.35)]" />
                    </div>
                </div>
                <div className="relative mt-14">
                    <Marquee speed={50}>
                        {playGames.map((g) => (
                            <span key={g} className="whitespace-nowrap rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-semibold text-violet-900 shadow-sm">{t(g)}</span>
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    );
}
