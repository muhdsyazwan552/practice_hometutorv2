import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';

/**
 * Vanta.js WAVES background: a slow, glossy 3D sea that tilts with the pointer.
 *
 * Same lifecycle as GameLanding/VantaNet: it only runs while on screen, is skipped for
 * people who prefer reduced motion, and the element's own background shows when
 * Vanta is not running. WAVES has no separate background colour; `color` is the
 * surface itself: a dark navy under light text, or a pale tint under dark text.
 */
export default function VantaWaves({ className = '', color = 0x1a3478, fallback = '#070b1a', ambientBoost = 1 }) {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        let effect = null;
        const small = window.innerWidth < 768;
        const start = () => {
            if (effect) return;
            try {
                effect = WAVES({
                    el: element,
                    THREE,
                    color,
                    shininess: 70,
                    waveHeight: small ? 12 : 16,
                    waveSpeed: 0.55,
                    zoom: small ? 0.75 : 0.9,
                    mouseControls: true,
                    touchControls: false,
                    gyroControls: false,
                    scale: 1,
                    scaleMobile: 1,
                });
                // Vanta targets old three.js, where point lights did not fade with distance.
                // In three 0.155+ they do, so the waves come out flat; turn the fall-off off.
                // Lights there are also ~π times weaker, which greys out a pale surface, so a
                // light version passes ambientBoost (about Math.PI) to restore the shadows.
                effect.scene?.traverse((o) => {
                    if (o.isPointLight) o.decay = 0;
                    if (o.isAmbientLight) o.intensity *= ambientBoost;
                });
            } catch {
                effect = null; // WebGL unavailable: the plain background stays.
            }
        };
        const stop = () => {
            effect?.destroy();
            effect = null;
        };

        const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
        observer.observe(element);
        return () => {
            observer.disconnect();
            stop();
        };
    }, [color, ambientBoost]);

    return <div ref={ref} aria-hidden className={className} style={{ backgroundColor: fallback }} />;
}
