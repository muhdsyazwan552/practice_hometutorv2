import { useEffect, useId, useRef, useState } from 'react';
import '../../../css/screenshot-gallery.css';

const screens = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        title: 'Setiap langkah, nampak kemajuannya.',
        description: 'Ringkasan pembelajaran dan kalendar aktiviti dalam dashboard pelajar.',
        width: 2476,
        height: 1354,
    },
    {
        id: 'subject-workspace',
        label: 'Ruang subjek',
        title: 'Satu subjek. Banyak ruang untuk belajar.',
        description: 'Ruang Bahasa Melayu dengan bab, topik dan pilihan latihan bertulis.',
        width: 2394,
        height: 1388,
    },
    {
        id: 'mastery',
        label: 'Misi & mastery',
        title: 'Ada cabaran untuk langkah seterusnya.',
        description: 'Practice Arena dengan cabaran mastery dan peringkat penguasaan topik.',
        width: 2748,
        height: 1376,
    },
    {
        id: 'play-library',
        label: 'HomeTutor Play',
        title: 'Bila belajar terasa seperti bermain.',
        description: 'Koleksi permainan HomeTutor Play merentas subjek dan tahap pembelajaran.',
        width: 2472,
        height: 1532,
    },
].map((screen, index) => ({ ...screen, index, src: `/images/landing-practice/screens/${screen.id}.webp` }));

function PauseIcon({ paused }) {
    return paused ? (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 3.7a.8.8 0 0 1 1.2-.7l9 6.3a.8.8 0 0 1 0 1.4l-9 6.3a.8.8 0 0 1-1.2-.7z" /></svg>
    ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="3" height="12" rx="1" /><rect x="12" y="4" width="3" height="12" rx="1" /></svg>
    );
}

function ScreenContent({ screen, decorative }) {
    return (
        <>
            <div className="ht-screen-browser" aria-hidden="true"><span className="ht-screen-dots"><i /><i /><i /></span><span>hometutor / {screen.label.toLowerCase()}</span><span className="ht-screen-expand">↗</span></div>
            <div className={`ht-screen-image ht-screen-image-${screen.id}`}><img src={screen.src} alt={decorative ? '' : screen.description} width={screen.width} height={screen.height} decoding="async" draggable="false" /></div>
            <div className="ht-screen-caption"><span><span className="ht-screen-number">0{screen.index + 1}</span><strong>{screen.label}</strong></span><span aria-hidden="true">↗</span></div>
        </>
    );
}

export default function ScreenshotGallery() {
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [activeScreen, setActiveScreen] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const dialogRef = useRef(null);
    const indexRefs = useRef([]);
    const returnFocusRef = useRef(null);
    const viewerTitle = useId();
    const viewerDescription = useId();
    const screen = screens[activeScreen];

    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(preference.matches);
        update();
        preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!viewerOpen) return undefined;
        const dialog = dialogRef.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        if (!dialog.open) dialog.showModal();
        return () => {
            document.body.style.overflow = previousOverflow;
            if (dialog.open) dialog.close();
        };
    }, [viewerOpen]);

    function openViewer(index) {
        setActiveScreen(index);
        returnFocusRef.current = indexRefs.current[index];
        setViewerOpen(true);
    }

    function finishClose() {
        setViewerOpen(false);
        returnFocusRef.current?.focus({ preventScroll: true });
    }

    function moveViewer(direction) {
        setActiveScreen(current => (current + direction + screens.length) % screens.length);
    }

    function renderGroup(items, decorative, key) {
        return <div className={`ht-screen-group${decorative ? ' ht-screen-group-copy' : ''}`} key={key} aria-hidden={decorative ? 'true' : undefined}>
            {items.map(item => decorative ? (
                <div className="ht-screen-card" key={item.id} onClick={() => openViewer(item.index)}><ScreenContent screen={item} decorative /></div>
            ) : (
                <button className="ht-screen-card" type="button" key={item.id} tabIndex={-1} onClick={() => openViewer(item.index)} aria-label={`Besarkan tangkap layar ${item.label}`}><ScreenContent screen={item} /></button>
            ))}
        </div>;
    }

    return (
        <section className={`ht-screens${paused || viewerOpen ? ' is-paused' : ''}`} aria-label="Terokai tangkap layar HomeTutor">
            <div className="ht-screens-heading"><div><p>DI DALAM HOMETUTOR</p><h2>Banyak cara untuk terus maju.</h2></div><button className="ht-screens-pause" type="button" onClick={() => setPaused(value => !value)} disabled={reducedMotion} aria-label={reducedMotion ? 'Animasi dimatikan mengikut tetapan gerakan peranti' : paused ? 'Sambung animasi tangkap layar' : 'Jeda animasi tangkap layar'} aria-pressed={paused || reducedMotion}><PauseIcon paused={paused || reducedMotion} /><span>{reducedMotion ? 'Gerakan minimum' : paused ? 'Sambung' : 'Jeda'}</span></button></div>
            <div className="ht-screens-reels">
                {[screens.slice(0, 2), screens.slice(2)].map((items, row) => (
                    <div className={`ht-screen-row ht-screen-row-${row + 1}`} key={row}>
                        <div className="ht-screen-track">
                            {row === 0 ? [renderGroup(items, false, 'original'), renderGroup(items, true, 'copy')] : [renderGroup(items, true, 'copy'), renderGroup(items, false, 'original')]}
                        </div>
                    </div>
                ))}
            </div>
            <div className="ht-screens-index" role="group" aria-label="Besarkan tangkap layar"><span className="ht-screens-index-label">LIHAT DEKAT</span>{screens.map((item, index) => <button key={item.id} type="button" onClick={() => openViewer(index)} ref={element => { indexRefs.current[index] = element; }} aria-label={`Besarkan tangkap layar ${item.label}`}><span className="ht-screens-index-number" aria-hidden="true">0{index + 1}</span>{item.label}<span className="ht-screens-index-arrow" aria-hidden="true">↗</span></button>)}</div>
            <p className="ht-screens-note">Tangkap layar sebenar platform. Paparan kemajuan ialah contoh, bukan data masa nyata.</p>
            <dialog className="ht-screen-dialog" ref={dialogRef} aria-labelledby={viewerTitle} aria-describedby={viewerDescription} onClose={finishClose} onClick={event => { if (event.target === event.currentTarget) dialogRef.current.close(); }} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveViewer(event.key === 'ArrowRight' ? 1 : -1); } }} data-lenis-prevent>
                <div className="ht-screen-dialog-panel">
                    <header><div><p>HOMETUTOR · {screen.label}</p><h2 id={viewerTitle}>{screen.title}</h2></div><button className="ht-screen-close" type="button" onClick={() => dialogRef.current.close()} aria-label="Tutup tangkap layar" autoFocus>×</button></header>
                    <div className="ht-screen-dialog-image" data-lenis-prevent>{viewerOpen && <img src={screen.src} alt={screen.description} width={screen.width} height={screen.height} />}</div>
                    <footer><div><p id={viewerDescription}>{screen.description}</p><span>Tangkap layar sebenar · Paparan contoh</span></div><div className="ht-screen-dialog-controls"><button type="button" onClick={() => moveViewer(-1)} aria-label="Tangkap layar sebelumnya">←</button><span aria-live="polite" aria-atomic="true">0{activeScreen + 1} / 04</span><button type="button" onClick={() => moveViewer(1)} aria-label="Tangkap layar seterusnya">→</button></div></footer>
                </div>
            </dialog>
        </section>
    );
}
