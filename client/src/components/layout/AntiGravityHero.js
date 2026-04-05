import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Realistic book: cover + spine strip + page block
function Book({ position, rotation, scale = 1, coverColor, spineColor }) {
  const group = useRef();

  return (
    <Float floatIntensity={1.2} speed={1.2} rotationIntensity={0.4}>
      <group ref={group} position={position} rotation={rotation} scale={scale}>
        {/* Main cover */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 2.0, 0.22]} />
          <meshStandardMaterial
            color={coverColor}
            roughness={0.78}
            metalness={0.08}
          />
        </mesh>
        {/* Spine highlight strip */}
        <mesh position={[-0.68, 0, 0]}>
          <boxGeometry args={[0.05, 2.0, 0.23]} />
          <meshStandardMaterial color={spineColor} roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Gold spine stripe accent */}
        <mesh position={[-0.65, 0, 0]}>
          <boxGeometry args={[0.012, 1.6, 0.24]} />
          <meshStandardMaterial color="#c9a84c" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Page block (right edge) */}
        <mesh position={[0.71, 0, 0]}>
          <boxGeometry args={[0.04, 1.94, 0.18]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.95} metalness={0} />
        </mesh>
        {/* Cover emboss line top */}
        <mesh position={[0, 0.85, 0.112]}>
          <boxGeometry args={[1.1, 0.008, 0.006]} />
          <meshStandardMaterial color={spineColor} roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Cover emboss line bottom */}
        <mesh position={[0, -0.85, 0.112]}>
          <boxGeometry args={[1.1, 0.008, 0.006]} />
          <meshStandardMaterial color={spineColor} roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

// Mouse-tracked rig for gentle parallax
function CameraRig({ children }) {
  const group = useRef();
  useFrame((state) => {
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      state.pointer.x * 0.25,
      0.04
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -state.pointer.y * 0.12,
      0.04
    );
  });
  return <group ref={group}>{children}</group>;
}

const BOOKS = [
  { position: [-2.8, 0.4, -2],   rotation: [0.1, 0.5, 0.08],  scale: 1.15, coverColor: '#1a1a2e', spineColor: '#c9a84c' },
  { position: [2.6, 0.8, -3],    rotation: [-0.05, -0.45, -0.06], scale: 0.95, coverColor: '#0d2137', spineColor: '#8ab4d4' },
  { position: [0.6, -1.6, -1.2], rotation: [0.15, 0.1, 0.18],  scale: 1.05, coverColor: '#2c1810', spineColor: '#c9a84c' },
  { position: [-3.2, -1.8, -3.5],rotation: [-0.2, 0.7, -0.15], scale: 0.88, coverColor: '#162b1f', spineColor: '#6abf8a' },
  { position: [3.8, -1.4, -4.5], rotation: [0.1, 0.2, 0.2],   scale: 1.1,  coverColor: '#1f1825', spineColor: '#a07cd8' },
  { position: [-1.4, 2.4, -3.8], rotation: [0.5, -0.6, -0.2], scale: 1.25, coverColor: '#1a1000', spineColor: '#c9a84c' },
  { position: [1.2, 2.7, -5.5],  rotation: [-0.4, 0.3, 0.6],  scale: 1.4,  coverColor: '#0a1628', spineColor: '#5a9ce0' },
];

export default function AntiGravityHero() {
  return (
    <div className="hero-canvas-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 44 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        shadows
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[6, 8, 4]} intensity={1.4} color="#fff8e8" castShadow />
        <directionalLight position={[-6, -4, -4]} intensity={0.5} color="#8ab4d4" />
        <pointLight position={[0, 0, 6]} intensity={0.8} color="#c9a84c" distance={18} />

        <Suspense fallback={null}>
          <CameraRig>
            {BOOKS.map((b, i) => <Book key={i} {...b} />)}
          </CameraRig>
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}




