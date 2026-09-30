import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import NET from 'vanta/dist/vanta.net.min';

/**
 * Vanta.js NET background: a slowly moving web of glowing points.
 *
 * It only runs while it is on screen (it is torn down when scrolled away, so
 * it costs nothing further down the page), is skipped for people who prefer
 * reduced motion, and uses fewer points on small screens. The element's own
 * background shows when Vanta is not running.
 *
 * Only NET, WAVES, HALO, GLOBE, FOG, RINGS, CLOUDS and CELLS work with this
 * project's three.js (0.185); DOTS and BIRDS throw.
 */
export default function VantaNet({ className = '', color = 0x8b5cf6, backgroundColor = 0x070712 }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let effect = null;
    const small = window.innerWidth < 768;
    const start = () => {
      if (effect) return;
      try {
        effect = NET({
          el: element,
          THREE,
          color,
          backgroundColor,
          points: small ? 7 : 11,
          maxDistance: small ? 18 : 22,
          spacing: small ? 20 : 17,
          showDots: true,
          mouseControls: true,
          touchControls: false,
          gyroControls: false,
          scale: 1,
          scaleMobile: 1,
        });
        // Light backgrounds (line colour darker than the background) draw the lines white in
        // current three.js: Vanta asks for `THREE.VertexColors`, which no longer exists, so the
        // per-line colours are ignored, and it sets blending to null. Its line colours fade from
        // the background to `color`, so vertex colours + normal blending is what it intends.
        // Dark backgrounds (additive blending, e.g. the game landing) are left as they are.
        if (effect.blending !== 'additive' && effect.linesMesh) {
          effect.linesMesh.material.vertexColors = true;
          effect.linesMesh.material.blending = THREE.NormalBlending;
          effect.linesMesh.material.needsUpdate = true;
        }
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
  }, [color, backgroundColor]);

  return <div ref={ref} aria-hidden className={className} style={{ backgroundColor: `#${backgroundColor.toString(16).padStart(6, '0')}` }} />;
}
