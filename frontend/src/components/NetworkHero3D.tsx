import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// Node Sphere
interface NodeData {
  position: [number, number, number];
  isSuspicious: boolean;
  size: number;
  color: string;
}

const NetworkGraph: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate deterministic network nodes
  const nodes = useMemo<NodeData[]>(() => {
    const pts: NodeData[] = [];
    const count = 38;
    for (let i = 0; i < count; i++) {
      // spherical distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.2 + Math.random() * 2.0;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const isSuspicious = i % 7 === 0;
      pts.push({
        position: [x, y, z],
        isSuspicious,
        size: isSuspicious ? 0.12 : 0.08,
        color: isSuspicious ? '#C96B35' : '#292520',
      });
    }
    return pts;
  }, []);

  // Generate connecting lines between nearby nodes
  const linePositions = useMemo(() => {
    const pos: number[] = [];
    const maxDist = 2.6;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const p1 = new THREE.Vector3(...nodes[i].position);
        const p2 = new THREE.Vector3(...nodes[j].position);
        if (p1.distanceTo(p2) < maxDist) {
          pos.push(...nodes[i].position, ...nodes[j].position);
        }
      }
    }
    return new Float32Array(pos);
  }, [nodes]);

  // Slow rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Rotating Geometric Security Prism */}
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.95, 0]} />
          <meshStandardMaterial
            color="#C96B35"
            roughness={0.25}
            metalness={0.85}
            wireframe={false}
            emissive="#A84E25"
            emissiveIntensity={0.2}
          />
        </mesh>
        {/* Outer wireframe layer */}
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshBasicMaterial color="#171512" wireframe opacity={0.35} transparent />
        </mesh>
      </Float>

      {/* Network Nodes */}
      {nodes.map((node, idx) => (
        <mesh key={idx} position={node.position}>
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshStandardMaterial
            color={node.color}
            roughness={node.isSuspicious ? 0.2 : 0.6}
            metalness={node.isSuspicious ? 0.9 : 0.3}
            emissive={node.isSuspicious ? '#C96B35' : '#000000'}
            emissiveIntensity={node.isSuspicious ? 0.8 : 0.0}
          />
        </mesh>
      ))}

      {/* Connecting Network Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#A99B89" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
};

export const NetworkHero3D: React.FC = () => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Fallback 2D visual for reduced motion or non-WebGL systems
  if (!hasWebGL || prefersReducedMotion) {
    return (
      <div className="w-full h-[380px] sm:h-[450px] rounded-2xl bg-surface border border-taupe/20 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-soft">
        <div className="absolute inset-0 bg-grain pointer-events-none" />
        <img
          src="/brand-icon.jpg"
          alt="UPI Fraud Spatial Signal"
          className="w-36 h-36 rounded-2xl object-cover shadow-elevated border border-accent/40 mb-4"
        />
        <p className="font-semibold text-text-main text-sm">UPI Transaction Graph Signal</p>
        <p className="text-taupe text-xs max-w-xs text-center mt-1">
          High-dimensional anomaly detection network topology (Static Render Mode)
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] sm:h-[480px] rounded-2xl bg-surface/80 border border-taupe/20 relative overflow-hidden shadow-elevated">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur border border-taupe/20 text-[11px] text-charcoal">
        <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
        <span className="font-mono font-medium">3D Topology • Realtime Spatial Signals</span>
      </div>

      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -5, -5]} color="#C96B35" intensity={2.0} />
        <NetworkGraph />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 2.4}
        />
      </Canvas>
    </div>
  );
};
