// Motion building blocks for the practice landing page, in the spirit of the
// React Bits / Aceternity UI copy-paste components (own implementations, no extra deps).
import { motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { Children, useMemo, useRef, useState } from 'react';

export const ease = [0.22, 1, 0.36, 1];

/** Soft pastel blobs drifting behind a section (Aurora background). */
export function Aurora({ className = '' }) {
    return (
        <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
            <div className="pl-aurora pl-aurora-1" />
            <div className="pl-aurora pl-aurora-2" />
            <div className="pl-aurora pl-aurora-3" />
        </div>
    );
}

/** Faint grid that fades out toward the edges. */
export function GridPattern({ className = '' }) {
    return <div aria-hidden className={`pl-grid pointer-events-none absolute inset-0 ${className}`} />;
}

// `wordClassName` is applied to every word: gradient text (background-clip) must sit on
// the word spans themselves, because transformed inline-blocks don't inherit the clip.
/** Words fade in from blur, one after another (React Bits BlurText). */
export function BlurText({ text, className = '', wordClassName = '', delay = 0, stagger = 0.07, as: Tag = 'span' }) {
    const words = text.split(' ');
    return (
        <Tag className={className} aria-label={text}>
            {words.map((word, i) => (
                <motion.span
                    key={`${word}-${i}`}
                    aria-hidden
                    className={`inline-block will-change-[filter,transform] ${wordClassName}`}
                    initial={{ opacity: 0, filter: 'blur(12px)', y: 18 }}
                    whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: delay + i * stagger, ease }}
                >
                    {word}
                    {i < words.length - 1 && ' '}
                </motion.span>
            ))}
        </Tag>
    );
}

/** Text with a light sweep running across it (React Bits ShinyText). */
export function ShinyText({ children, className = '' }) {
    return <span className={`pl-shiny ${className}`}>{children}</span>;
}

/** Card with a glow and border highlight that follow the pointer (React Bits SpotlightCard). */
export function SpotlightCard({ children, className = '', glow = 'rgba(37,99,235,.10)', edge = 'rgba(37,99,235,.55)' }) {
    const x = useMotionValue(-400);
    const y = useMotionValue(-400);
    const background = useMotionTemplate`radial-gradient(440px circle at ${x}px ${y}px, ${glow}, transparent 65%)`;
    const border = useMotionTemplate`radial-gradient(280px circle at ${x}px ${y}px, ${edge}, transparent 70%)`;

    const move = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
    };
    const leave = () => { x.set(-400); y.set(-400); };

    return (
        <div
            onPointerMove={move}
            onPointerLeave={leave}
            className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_-12px_rgba(15,23,42,.10)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,.04),0_24px_48px_-16px_rgba(15,23,42,.18)] ${className}`}
        >
            {/* Border highlight: a masked layer that only shows on the 1px edge. */}
            <motion.div aria-hidden className="pl-card-edge pointer-events-none absolute inset-0 z-10 rounded-3xl" style={{ background: border }} />
            <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background }} />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

/** Endless horizontal row, pauses on hover, fades at the edges (Aceternity InfiniteMovingCards). */
export function Marquee({ children, reverse = false, speed = 40, className = '' }) {
    const items = Children.toArray(children);
    return (
        <div className={`pl-marquee group flex overflow-hidden ${className}`}>
            {[0, 1].map((copy) => (
                <div
                    key={copy}
                    aria-hidden={copy === 1}
                    className="pl-marquee-track flex shrink-0 items-center gap-4 pr-4 group-hover:[animation-play-state:paused]"
                    style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
                >
                    {items}
                </div>
            ))}
        </div>
    );
}

/** Card that tilts toward the pointer; children with `data-depth` pop forward (Aceternity 3D Card). */
export function Card3D({ children, className = '' }) {
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 180, damping: 16 });
    const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 180, damping: 16 });
    const [hover, setHover] = useState(false);

    const move = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
    };
    const leave = () => { mx.set(0); my.set(0); setHover(false); };

    return (
        <div className="[perspective:1000px]" onPointerMove={move} onPointerEnter={() => setHover(true)} onPointerLeave={leave}>
            <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }} className={`pl-card3d ${hover ? 'is-hover' : ''} ${className}`}>
                {children}
            </motion.div>
        </div>
    );
}

/** Falling streaks for dark panels (Aceternity Meteors). Positions are fixed per mount. */
export function Meteors({ count = 18 }) {
    const meteors = useMemo(() => Array.from({ length: count }, (_, i) => ({
        left: `${Math.round((i / count) * 110 - 5 + Math.random() * 6)}%`,
        delay: `${(Math.random() * 6).toFixed(2)}s`,
        duration: `${(4 + Math.random() * 6).toFixed(2)}s`,
    })), [count]);
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {meteors.map((m, i) => (
                <span key={i} className="pl-meteor" style={{ left: m.left, animationDelay: m.delay, animationDuration: m.duration }} />
            ))}
        </div>
    );
}

/**
 * Text blocks scroll past on one side while a sticky panel on the other swaps
 * to match the block in view (Aceternity Sticky Scroll Reveal).
 */
export function StickyScroll({ items }) {
    const ref = useRef(null);
    const [active, setActive] = useState(0);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end center'] });
    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        setActive(Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length))));
    });

    return (
        <div ref={ref} className="relative grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
                {items.map((item, i) => (
                    <motion.div
                        key={item.title}
                        animate={{ opacity: active === i ? 1 : 0.35 }}
                        transition={{ duration: 0.4 }}
                        className="flex min-h-[46vh] flex-col justify-center py-10 lg:min-h-[70vh]"
                    >
                        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Langkah {String(i + 1).padStart(2, '0')}</span>
                        <h3 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">{item.title}</h3>
                        <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-600">{item.text}</p>
                        {/* On phones the sticky panel is hidden, so show the visual inline. */}
                        <div className="mt-8 lg:hidden">{item.visual}</div>
                    </motion.div>
                ))}
            </div>
            <div className="hidden lg:block">
                <div className="sticky top-[15vh] h-[70vh]">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.title}
                            initial={false}
                            animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 0.95, y: active === i ? 0 : 24 }}
                            transition={{ duration: 0.5, ease }}
                            className="absolute inset-0"
                            style={{ pointerEvents: active === i ? 'auto' : 'none' }}
                        >
                            {item.visual}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Button pulled toward the pointer. */
export function Magnetic({ children, strength = 0.3 }) {
    const x = useSpring(0, { stiffness: 260, damping: 16 });
    const y = useSpring(0, { stiffness: 260, damping: 16 });
    return (
        <motion.span
            className="inline-block"
            style={{ x, y }}
            onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                x.set((e.clientX - r.left - r.width / 2) * strength);
                y.set((e.clientY - r.top - r.height / 2) * strength);
            }}
            onPointerLeave={() => { x.set(0); y.set(0); }}
        >
            {children}
        </motion.span>
    );
}
