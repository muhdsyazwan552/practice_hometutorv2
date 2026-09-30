import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// One glowing orb per subject family, circling the core.
const ORBS = ['#f43f5e', '#f59e0b', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];

function Core({ calm }) {
  const group = useRef(null);
  const shell = useRef(null);
  const ringA = useRef(null);
  const ringB = useRef(null);
  const orbs = useRef([]);

  useFrame((state, delta) => {
    const speed = calm ? 0.25 : 1;
    const t = state.clock.elapsedTime * speed;
    // Lean toward the pointer, smoothly.
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x * 0.5, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y * 0.35, 0.05);
    }
    if (shell.current) {
      shell.current.rotation.x += delta * 0.15 * speed;
      shell.current.rotation.y += delta * 0.22 * speed;
    }
    if (ringA.current) ringA.current.rotation.z += delta * 0.35 * speed;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.25 * speed;
    orbs.current.forEach((orb, index) => {
      if (!orb) return;
      const angle = t * 0.6 + (index / ORBS.length) * Math.PI * 2;
      orb.position.set(Math.cos(angle) * 2.35, Math.sin(angle * 2) * 0.35, Math.sin(angle) * 2.35);
    });
  });

  return (
    <group ref={group}>
      <Float speed={calm ? 0.6 : 2} rotationIntensity={0.4} floatIntensity={0.8}>
        {/* Molten inner core */}
        <mesh>
          <icosahedronGeometry args={[1.05, 8]} />
          <MeshDistortMaterial color="#3b0f86" emissive="#6d28d9" emissiveIntensity={0.35} roughness={0.12} metalness={0.85} distort={calm ? 0.15 : 0.38} speed={calm ? 0.5 : 2.2} />
        </mesh>

        {/* Wireframe shell */}
        <mesh ref={shell}>
          <icosahedronGeometry args={[1.55, 1]} />
          <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.45} toneMapped={false} />
        </mesh>

        {/* Orbit rings */}
        <mesh ref={ringA} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[2.35, 0.018, 16, 160]} />
          <meshBasicMaterial color="#67e8f9" toneMapped={false} />
        </mesh>
        <mesh ref={ringB} rotation={[Math.PI / 1.7, 0.5, 0]}>
          <torusGeometry args={[2.7, 0.012, 16, 160]} />
          <meshBasicMaterial color="#f0abfc" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </Float>

      {ORBS.map((color, index) => (
        <mesh key={color} ref={(orb) => { orbs.current[index] = orb; }}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}

      <Sparkles count={calm ? 30 : 70} scale={[7, 5, 4]} size={2.4} speed={calm ? 0.1 : 0.4} color="#c4b5fd" />
    </group>
  );
}

/**
 * The hero's 3D centrepiece (React Three Fiber): a pulsing "power core" with
 * orbit rings and subject orbs. Transparent, so the Vanta background shows
 * through; paused when off screen; calmer for reduced-motion users.
 */
export default function PowerCore({ className = '' }) {
  const wrapper = useRef(null);
  const [visible, setVisible] = useState(true);
  const calm = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (wrapper.current) observer.observe(wrapper.current);
    return () => observer.disconnect();
  }, []);

  return (
    // Bloom renders onto an opaque black buffer; "screen" blending makes that
    // black disappear over the page's dark background.
    // The round mask fades the canvas edges so its square never shows.
    <div
      ref={wrapper}
      className={className}
      style={{
        mixBlendMode: 'screen',
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 58%, transparent 72%)',
        maskImage: 'radial-gradient(circle at 50% 50%, #000 58%, transparent 72%)',
      }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop={visible ? 'always' : 'never'}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 3, 4]} intensity={90} color="#22d3ee" />
        <pointLight position={[-4, -2, 3]} intensity={80} color="#ec4899" />
        <pointLight position={[0, 4, -3]} intensity={40} color="#a78bfa" />
        <Core calm={calm} />
        {/* Only the bright rings and orbs cross the threshold, so the core keeps its shape. */}
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom mipmapBlur intensity={1.4} luminanceThreshold={0.6} luminanceSmoothing={0.3} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
