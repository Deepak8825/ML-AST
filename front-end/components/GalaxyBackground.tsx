"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo } from "react"
import * as THREE from "three"

// ============================================================================
// REALISTIC SPIRAL GALAXY — Hubble-style, warm core → blue arms → deep outer
// ============================================================================

function Galaxy() {
    const pointsRef = useRef<THREE.Points>(null!)
    const { mouse } = useThree()

    const parameters = {
        count: 9000,
        size: 0.006,
        radius: 9,
        branches: 5,
        spin: 1.3,
        randomness: 0.25,
        randomnessPower: 5,
    }

    const geometry = useMemo(() => {
        const positions = new Float32Array(parameters.count * 3)
        const colors = new Float32Array(parameters.count * 3)

        const coreColor = new THREE.Color("#fff5d1")   // warm white core
        const midColor = new THREE.Color("#8ec5ff")    // blue arm
        const outerColor = new THREE.Color("#1e3a8a")  // deep blue outer

        for (let i = 0; i < parameters.count; i++) {
            const i3 = i * 3

            const radius = Math.random() * parameters.radius
            const branchAngle =
                ((i % parameters.branches) / parameters.branches) * Math.PI * 2
            const spinAngle = radius * parameters.spin

            const randomX =
                Math.pow(Math.random(), parameters.randomnessPower) *
                (Math.random() < 0.5 ? 1 : -1) *
                parameters.randomness *
                radius

            const randomY = (Math.random() - 0.5) * 0.2

            const randomZ =
                Math.pow(Math.random(), parameters.randomnessPower) *
                (Math.random() < 0.5 ? 1 : -1) *
                parameters.randomness *
                radius

            positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
            positions[i3 + 1] = randomY
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

            // Realistic radial color blending: warm core → blue mid → deep outer
            let mixedColor = coreColor.clone()

            if (radius < parameters.radius * 0.3) {
                mixedColor.lerp(midColor, radius / (parameters.radius * 0.3))
            } else {
                mixedColor = midColor.clone()
                mixedColor.lerp(
                    outerColor,
                    (radius - parameters.radius * 0.3) / (parameters.radius * 0.7)
                )
            }

            colors[i3] = mixedColor.r
            colors[i3 + 1] = mixedColor.g
            colors[i3 + 2] = mixedColor.b
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
        return geometry
    }, [])

    useFrame((state, delta) => {
        if (!pointsRef.current) return
        // Much slower rotation (realistic)
        pointsRef.current.rotation.y += delta * 0.01
        // Very subtle mouse parallax
        pointsRef.current.rotation.x = mouse.y * 0.1
        pointsRef.current.rotation.z = mouse.x * 0.1
    })

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
                size={parameters.size}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                vertexColors
                transparent
                opacity={0.55}
            />
        </points>
    )
}

// ============================================================================
// EXPORT — Ultra-dark background + depth fog
// ============================================================================

export default function GalaxyBackground() {
    return (
        <Canvas
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: -1,
                pointerEvents: "none",
            }}
            camera={{ position: [0, 2, 12], fov: 75 }}
            gl={{
                antialias: false,
                powerPreference: "low-power",
                // @ts-ignore
                stencil: false,
            }}
            dpr={[1, 1.5]}
        >
            <color attach="background" args={["#020409"]} />
            <fog attach="fog" args={["#020409", 4, 18]} />
            <Galaxy />
        </Canvas>
    )
}
