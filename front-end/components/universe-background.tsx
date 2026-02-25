'use client'

import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// CELESTIAL BODY — A softly glowing sphere that orbits slowly
// ============================================================================

interface CelestialProps {
    radius: number
    color: string
    emissive: string
    emissiveIntensity: number
    position: [number, number, number]
    orbitRadius: number
    orbitSpeed: number
    rotationSpeed: number
    phaseOffset: number
}

function CelestialBody({
    radius,
    color,
    emissive,
    emissiveIntensity,
    position,
    orbitRadius,
    orbitSpeed,
    rotationSpeed,
    phaseOffset,
}: CelestialProps) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        // Slow orbital drift
        meshRef.current.position.x = position[0] + Math.sin(t * orbitSpeed + phaseOffset) * orbitRadius
        meshRef.current.position.y = position[1] + Math.cos(t * orbitSpeed * 0.6 + phaseOffset) * (orbitRadius * 0.3)
        meshRef.current.position.z = position[2] + Math.cos(t * orbitSpeed * 0.8 + phaseOffset) * (orbitRadius * 0.5)
        // Gentle self-rotation
        meshRef.current.rotation.y += rotationSpeed * 0.01
        meshRef.current.rotation.x += rotationSpeed * 0.003
    })

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[radius, 16, 12]} />
            <meshStandardMaterial
                color={color}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
                roughness={0.8}
                metalness={0.2}
            />
        </mesh>
    )
}

// ============================================================================
// NEBULA CLOUD — Soft transparent volume for depth
// ============================================================================

function NebulaCloud({ position, color, size, opacity }: {
    position: [number, number, number]
    color: string
    size: number
    opacity: number
}) {
    const meshRef = useRef<THREE.Mesh>(null!)

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        meshRef.current.rotation.z = t * 0.01
        meshRef.current.rotation.y = t * 0.005
    })

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[size, 12, 8]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
            />
        </mesh>
    )
}

// ============================================================================
// MOUSE PARALLAX CAMERA RIG
// ============================================================================

function CameraRig() {
    const { camera } = useThree()
    const mouse = useRef({ x: 0, y: 0 })
    const smoothed = useRef({ x: 0, y: 0 })

    React.useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            // Normalize to -1..+1
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
            mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener('mousemove', handleMove)
        return () => window.removeEventListener('mousemove', handleMove)
    }, [])

    useFrame(() => {
        // Smoothly lerp toward mouse position — subtle parallax
        smoothed.current.x += (mouse.current.x - smoothed.current.x) * 0.02
        smoothed.current.y += (mouse.current.y - smoothed.current.y) * 0.02
        camera.position.x = smoothed.current.x * 1.5
        camera.position.y = smoothed.current.y * 1.0
        camera.lookAt(0, 0, 0)
    })

    return null
}

// ============================================================================
// SCENE — Assembles stars, planets, nebulae, and camera rig
// ============================================================================

function Scene() {
    // Celestial bodies — placed far enough to feel like deep space
    const planets = useMemo<CelestialProps[]>(() => [
        {
            radius: 0.6,
            color: '#1a3a5c',
            emissive: '#0e4a8a',
            emissiveIntensity: 0.3,
            position: [-8, 3, -15],
            orbitRadius: 1.5,
            orbitSpeed: 0.08,
            rotationSpeed: 0.4,
            phaseOffset: 0,
        },
        {
            radius: 0.35,
            color: '#3d2b5a',
            emissive: '#6b3fa0',
            emissiveIntensity: 0.25,
            position: [10, -2, -20],
            orbitRadius: 1.0,
            orbitSpeed: 0.06,
            rotationSpeed: 0.6,
            phaseOffset: 2,
        },
        {
            radius: 0.8,
            color: '#1c3040',
            emissive: '#2a6090',
            emissiveIntensity: 0.2,
            position: [5, 5, -25],
            orbitRadius: 2.0,
            orbitSpeed: 0.04,
            rotationSpeed: 0.3,
            phaseOffset: 4,
        },
        {
            radius: 0.25,
            color: '#4a3060',
            emissive: '#8855bb',
            emissiveIntensity: 0.35,
            position: [-12, -4, -18],
            orbitRadius: 0.8,
            orbitSpeed: 0.1,
            rotationSpeed: 0.8,
            phaseOffset: 1,
        },
        {
            radius: 0.45,
            color: '#1a2a3a',
            emissive: '#3388aa',
            emissiveIntensity: 0.2,
            position: [15, 1, -30],
            orbitRadius: 1.2,
            orbitSpeed: 0.05,
            rotationSpeed: 0.5,
            phaseOffset: 3,
        },
    ], [])

    return (
        <>
            {/* Ambient fill — very dim so planets stay dark/moody */}
            <ambientLight intensity={0.08} />
            {/* Distant directional light — cold blue tint */}
            <directionalLight position={[10, 5, 5]} intensity={0.15} color="#88bbff" />
            <pointLight position={[-10, -5, -10]} intensity={0.1} color="#6644aa" />

            {/* drei Stars component — 3000 stars, small radius for depth */}
            <Stars
                radius={80}
                depth={60}
                count={3000}
                factor={3}
                saturation={0}
                fade
                speed={0.4}
            />

            {/* Nebula clouds for atmospheric depth */}
            <NebulaCloud position={[-6, 2, -12]} color="#1a1040" size={4} opacity={0.04} />
            <NebulaCloud position={[8, -3, -18]} color="#0a2040" size={5} opacity={0.03} />
            <NebulaCloud position={[0, 4, -25]} color="#200a30" size={6} opacity={0.025} />

            {/* Floating celestial bodies */}
            {planets.map((p, i) => (
                <CelestialBody key={i} {...p} />
            ))}

            {/* Mouse parallax camera controller */}
            <CameraRig />
        </>
    )
}

// ============================================================================
// MAIN EXPORT — Fixed background canvas
// ============================================================================

const UniverseBackground: React.FC = () => {
    return (
        <div
            className="fixed inset-0 -z-10"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
        >
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 200 }}
                gl={{
                    antialias: false,
                    alpha: false,
                    powerPreference: 'low-power',
                    // @ts-ignore — stencil is a valid WebGLRenderer option
                    stencil: false,
                    depth: true,
                }}
                dpr={[1, 1.5]}
                style={{ background: '#0B0F1A' }}
                // Re-enable pointer events only on the canvas itself (not needed)
                onCreated={({ gl }) => {
                    gl.domElement.style.pointerEvents = 'none'
                    gl.setClearColor('#0B0F1A')
                }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </div>
    )
}

export default UniverseBackground
