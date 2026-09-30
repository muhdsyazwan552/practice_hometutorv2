/*
 * 3D hero background: glossy shapes in the spectrum colours float around the headline.
 * The camera leans toward the pointer, the shapes drift up as the page scrolls, and a
 * hover/tap makes a shape grow and spin. Lighting comes from procedural Lightformers,
 * so no HDR file is downloaded.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Lightformer, PerformanceMonitor, RoundedBox } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// [x, y] are fractions of half the visible width/height, so the ring of shapes keeps
// clear of the centred text at any screen size. z pushes a shape back for depth.
// y stays within about +0.6 (below the fixed nav) and above about -0.4 (the checklist
// row), except at the far edges (|x| > 0.85) where the checklist never reaches.
const shapes = [
    { kind: 'knot', pos: [-0.8, 0.42, -1], size: 0.55, color: '#8b5cf6' },
    { kind: 'ico', pos: [0.8, 0.44, -0.6], size: 0.62, color: '#f59e0b' },
    { kind: 'box', pos: [-0.88, -0.42, 0], size: 0.6, color: '#3b82f6' },
    { kind: 'torus', pos: [0.88, -0.4, -0.8], size: 0.55, color: '#ec4899' },
    { kind: 'sphere', pos: [-0.64, -0.14, 0.6], size: 0.32, color: '#22c55e' },
    { kind: 'octa', pos: [0.64, -0.12, 0.4], size: 0.4, color: '#ef4444' },
    { kind: 'cone', pos: [-0.54, 0.58, -2], size: 0.36, color: '#0ea5e9' },
    { kind: 'sphere', pos: [0.52, 0.58, -2.4], size: 0.3, color: '#eab308' },
    { kind: 'dodeca', pos: [0.94, 0.14, -3], size: 0.4, color: '#a855f7' },
    { kind: 'capsule', pos: [-0.7, 0.08, -3.5], size: 0.3, color: '#f43f5e' },
];

// Phones: the text fills the middle, so shapes only sit in the corners.
const phoneShapes = [
    { kind: 'knot', pos: [-0.82, 0.8, -1], size: 0.5, color: '#8b5cf6' },
    { kind: 'ico', pos: [0.84, 0.76, -0.6], size: 0.55, color: '#f59e0b' },
    { kind: 'box', pos: [-0.86, -0.8, 0], size: 0.55, color: '#3b82f6' },
    { kind: 'torus', pos: [0.86, -0.74, -0.8], size: 0.5, color: '#ec4899' },
    { kind: 'sphere', pos: [0.1, -0.92, -2], size: 0.3, color: '#22c55e' },
];

const CAMERA_Z = 10;

function Geometry({ kind }) {
    switch (kind) {
        case 'knot': return <torusKnotGeometry args={[0.7, 0.26, 160, 24]} />;
        case 'ico': return <icosahedronGeometry args={[1, 0]} />;
        case 'torus': return <torusGeometry args={[0.8, 0.3, 32, 96]} />;
        case 'octa': return <octahedronGeometry args={[1, 0]} />;
        case 'cone': return <coneGeometry args={[0.8, 1.5, 48]} />;
        case 'dodeca': return <dodecahedronGeometry args={[1, 0]} />;
        case 'capsule': return <capsuleGeometry args={[0.45, 0.9, 12, 32]} />;
        default: return <sphereGeometry args={[1, 48, 48]} />;
    }
}

function Shape({ kind, pos, size, color, index, reduced, scale }) {
    const mesh = useRef(null);
    const [hovered, setHovered] = useState(false);
    const spin = useRef(0); // extra spin speed from a tap, decays over time
    const { viewport } = useThree();
    const base = useMemo(() => new THREE.Euler(index * 0.7, index * 1.3, 0), [index]);
    // Shapes further back need a wider spread to land on the same spot on screen.
    const depth = (CAMERA_Z - pos[2]) / CAMERA_Z;

    useEffect(() => {
        if (!hovered) return undefined;
        document.body.style.cursor = 'pointer';
        return () => { document.body.style.cursor = ''; };
    }, [hovered]);

    useFrame((state, delta) => {
        const m = mesh.current;
        const dt = Math.min(delta, 0.1);
        spin.current *= 0.96;
        const speed = (reduced ? 0 : 0.25) + spin.current;
        m.rotation.x += dt * speed * 0.6;
        m.rotation.y += dt * speed;
        const goal = size * scale * (hovered ? 1.18 : 1);
        m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, goal, 0.12));
    });

    const kick = (e) => { e.stopPropagation(); spin.current = 9; };

    return (
        <Float speed={reduced ? 0 : 1.4} rotationIntensity={reduced ? 0 : 0.6} floatIntensity={reduced ? 0 : 1.2}>
            <mesh
                ref={mesh}
                position={[(pos[0] * viewport.width * depth) / 2, (pos[1] * viewport.height * depth) / 2, pos[2]]}
                rotation={base}
                scale={size * scale}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={() => setHovered(false)}
                onPointerDown={kick}
            >
                {kind === 'box' ? (
                    <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.28} smoothness={6}>
                        <meshPhysicalMaterial color={color} roughness={0.22} metalness={0.05} clearcoat={1} clearcoatRoughness={0.08} />
                    </RoundedBox>
                ) : (
                    <>
                        <Geometry kind={kind} />
                        <meshPhysicalMaterial color={color} roughness={0.22} metalness={0.05} clearcoat={1} clearcoatRoughness={0.08} flatShading={['ico', 'octa', 'dodeca'].includes(kind)} />
                    </>
                )}
            </mesh>
        </Float>
    );
}

/** Camera leans toward the pointer; the whole cloud rises and turns as the page scrolls. */
function Rig({ children, pointer, reduced }) {
    const group = useRef(null);
    const { camera } = useThree();
    useFrame(() => {
        const px = reduced ? 0 : pointer.current.x;
        const py = reduced ? 0 : pointer.current.y;
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, px * 0.9, 0.05);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, py * 0.6, 0.05);
        camera.lookAt(0, 0, 0);
        const scroll = typeof window === 'undefined' ? 0 : window.scrollY;
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, scroll * 0.004, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, reduced ? 0 : scroll * 0.0006, 0.1);
    });
    return <group ref={group}>{children}</group>;
}

function Scene({ pointer, reduced }) {
    const { viewport } = useThree();
    // Smaller shapes on narrow screens, where they sit closer to the text.
    const scale = THREE.MathUtils.clamp(viewport.width / 11, 0.45, 1);
    const list = viewport.aspect < 0.9 ? phoneShapes : shapes;

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 6, 5]} intensity={1.6} />
            <directionalLight position={[-6, -2, 2]} intensity={0.5} color="#c7d2fe" />
            <Rig pointer={pointer} reduced={reduced}>
                {list.map((s, i) => <Shape key={i} index={i} reduced={reduced} scale={scale} {...s} />)}
            </Rig>
            <Environment resolution={256}>
                <Lightformer form="rect" intensity={3} position={[0, 5, -6]} scale={[12, 4, 1]} />
                <Lightformer form="rect" intensity={2} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
                <Lightformer form="rect" intensity={1.5} color="#fbcfe8" position={[6, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
                <Lightformer form="ring" intensity={2} color="#bfdbfe" position={[0, 0, 8]} scale={4} />
            </Environment>
        </>
    );
}

const prefersLite = () => typeof window !== 'undefined'
    && ((navigator.hardwareConcurrency || 8) <= 4 || window.matchMedia('(pointer: coarse)').matches);

/**
 * `eventSource` is the hero section: the canvas sits behind the text, so pointer events
 * are read from the section instead, and shapes still react while the text is on top.
 */
export default function HeroScene({ eventSource, reduced = false }) {
    const wrap = useRef(null);
    const pointer = useRef({ x: 0, y: 0 });
    const [visible, setVisible] = useState(true);
    const [dpr, setDpr] = useState(() => (prefersLite() ? 1 : 1.75));

    // Nothing is drawn while the hero is scrolled out of view.
    useEffect(() => {
        const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' });
        if (wrap.current) io.observe(wrap.current);
        return () => io.disconnect();
    }, []);

    useEffect(() => {
        const move = (e) => {
            pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
        };
        window.addEventListener('pointermove', move, { passive: true });
        return () => window.removeEventListener('pointermove', move);
    }, []);

    return (
        <div ref={wrap} aria-hidden className="absolute inset-0">
            <Canvas
                eventSource={eventSource}
                eventPrefix="client"
                dpr={dpr}
                frameloop={visible ? 'always' : 'never'}
                gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0, CAMERA_Z], fov: 35 }}
            >
                <PerformanceMonitor onDecline={() => setDpr(1)} />
                <Suspense fallback={null}>
                    <Scene pointer={pointer} reduced={reduced} />
                </Suspense>
            </Canvas>
        </div>
    );
}
