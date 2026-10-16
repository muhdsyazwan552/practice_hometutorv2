import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import useMarketingCopy from './useMarketingCopy';
import portraits from './about-tutor-images.json';
import '../../../css/legacy-about.css';

const technology = [
    { title: 'HOMETUTOR QUESTIONNAIRES', text: 'We use data from the platform’s questionnaires to track the student’s mastery level of the topics to tailor the learning experience to each student’s needs.' },
    { title: 'XCELEARN ONLINE TUITION PLATFORM', text: 'Our state-of-the-art platform offers interactive lessons, real-time feedback, and a wealth of resources to support personalized learning.' },
    { title: 'DATA-DRIVEN INSIGHTS', text: 'Our platform includes a variety of tools and resources to make learning interactive and fun' },
];
const teaching = [
    { title: 'Teaching with technology', text: 'Skilled in teaching using technology/ digital tools, proficient in using devices, and able to adapt technology according to students’ needs.' },
    { title: 'Commitment to learning', text: 'Exhibits high levels of commitment and dedication in fulfilling duties, with a focus on effective team communication and collaboration.' },
    { title: 'Engaging lessons', text: 'Delivers engaging and effective lessons in the Dual Language Program (DLP), ensuring students remain interested and attentive.' },
];

function Reveal({ children, className = '', delay = 0 }) {
    const reduce = useReducedMotion();
    return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 28, filter: 'blur(7px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true, amount: .15 }} transition={{ duration: reduce ? 0 : .7, delay: reduce ? 0 : delay, ease: [.22,1,.36,1] }}>{children}</motion.div>;
}

function StudentVisual() {
    const { t } = useMarketingCopy();
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [18, -24]);
    return <div ref={ref} className="about-student-visual">
        <motion.span className="about-student-orbit about-student-orbit-back" aria-hidden="true" initial={reduce ? false : { opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [.22, 1, .36, 1] }} />
        <motion.span className="about-student-orbit about-student-orbit-front" aria-hidden="true" initial={reduce ? false : { opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, delay: .15, ease: [.22, 1, .36, 1] }} />
        <motion.div className="about-student-image" style={{ y: reduce ? 0 : y }}><Reveal delay={.2}><img src="/images/landing-practice/about-students.png" alt={t('Two students learning independently with a tablet and phone')} width="1086" height="842" fetchPriority="high" decoding="async" /></Reveal></motion.div>
    </div>;
}

function TutorComposition() {
    const { t } = useMarketingCopy();
    const reduce = useReducedMotion();
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [20, -20]);
    return <div ref={ref} className="about-tutor-stage">
        <motion.ul className="about-tutor-composition" aria-label={t('A selection of HomeTutor tutors')} style={{ y: reduce ? 0 : y }}>
            {portraits.map((portrait, index) => <motion.li key={portrait.image} className={`about-tutor-cutout about-tutor-cutout-${index}`} initial={reduce ? false : { opacity: 0, x: (index - 2) * 28, y: 70, scale: .88, filter: 'blur(6px)' }} whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }} viewport={{ once: true, amount: .12 }} transition={{ duration: reduce ? 0 : .95, delay: reduce ? 0 : Math.abs(index - 2) * .13, ease: [.22, 1, .36, 1] }}>
                <img src={portrait.image} style={{ '--portrait-mask': `url("${portrait.mask}")` }} alt={t('HomeTutor tutor')} width="400" height="400" loading="lazy" decoding="async" />
            </motion.li>)}
        </motion.ul>
    </div>;
}

export default function LegacyAbout() {
    const { t } = useMarketingCopy();
    return <div className="about-page">
        <section className="about-hero about-wrap">
            <Reveal className="about-hero-copy">
                <p className="about-eyebrow">{t('TENTANG KAMI')}</p>
                <h1>{t('Cultivate')}<span>{t('self-directed learning')}</span></h1>
                <p className="about-hero-description">{t('We are committed to create a student with autodidact capability')}</p>
                <a className="about-team-link" href="#about-tutors">{t('Lihat pasukan tutor')}<span aria-hidden="true">↘</span></a>
            </Reveal>
            <StudentVisual />
        </section>

        <section className="about-purpose">
            <div className="about-wrap">
                <Reveal className="about-purpose-heading"><p className="about-eyebrow">{t('01 / OUR PURPOSE')}</p><h2>{t('Mission and vision')}</h2></Reveal>
                <div className="about-purpose-grid">
                    <Reveal className="about-purpose-item" delay={.08}><span className="about-purpose-label">{t('MISSION')}</span><h3>{t('To make quality digital learning accessible to every child.')}</h3></Reveal>
                    <Reveal className="about-purpose-item" delay={.2}><span className="about-purpose-label">{t('VISION')}</span><h3>{t('To empower every child to learn confidently and achieve their full potential.')}</h3></Reveal>
                </div>
                <Reveal className="about-purpose-description" delay={.25}><p>{t('HomeTutor is an online learning platform with live classes, revision resources, interactive exercises, and academic support.')}</p></Reveal>
            </div>
        </section>

        <section className="about-readiness">
            <div className="about-wrap about-editorial-row">
                <Reveal><span className="about-section-number" aria-hidden="true">02 /</span><h2>{t('Assess readiness')}<span>{t('to learn')}</span></h2></Reveal>
                <Reveal delay={.12}><p>{t('Involves students conducting a self-evaluation of their current situation, study habits, family situation, and support network both at school and at home and also involves evaluating past experiences with independent learning.')}</p></Reveal>
            </div>
        </section>

        <section className="about-technology about-wrap">
            <Reveal className="about-section-heading"><p className="about-eyebrow">{t('03 / PEMBELAJARAN DIGITAL')}</p><h2>{t('Leveraging Technology')}<span>{t('for Better Learning')}</span></h2></Reveal>
            <div className="about-technology-grid">{technology.map((item,index) => <Reveal key={t(item.title)} delay={index * .1} className="about-technology-item"><span className="about-feature-index" aria-hidden="true">0{index + 1}</span><h3>{t(item.title)}</h3><p>{t(item.text)}</p></Reveal>)}</div>
        </section>

        <section className="about-team" id="about-tutors">
            <div className="about-wrap">
                <Reveal className="about-team-heading"><div><p className="about-eyebrow">{t('04 / PASUKAN TUTOR')}</p><h2>{t('Improve Achievement')}<span>{t('with Tutors HomeTutor')}</span></h2></div><p className="about-more-tutors"><strong>{t('50 more tutors')}</strong><span>{t('Supporting learners across primary and secondary levels.')}</span></p></Reveal>
                <TutorComposition />
                <div className="about-teaching-grid">{teaching.map((item,index) => <Reveal key={t(item.title)} delay={index * .08}><span className="about-teaching-marker" aria-hidden="true">✦</span><h3>{t(item.title)}</h3><p>{t(item.text)}</p></Reveal>)}</div>
            </div>
        </section>
    </div>;
}
