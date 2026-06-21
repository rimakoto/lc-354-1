import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'

interface SplashParticlesProps {
  wheelPosition?: [number, number, number]
  wheelRadius?: number
  wheelWidth?: number
}

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

const MAX_PARTICLES = 300

export function SplashParticles({
  wheelPosition = [0, 0, 0],
  wheelRadius = 2.5,
  wheelWidth = 1.2,
}: SplashParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const { waterSpeed } = useSceneStore()
  const particlesRef = useRef<Particle[]>([])
  const lastSplashAngleRef = useRef<number>(0)

  const [particleCount, setParticleCount] = useState(0)

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const colors = new Float32Array(MAX_PARTICLES * 3)
    const sizes = new Float32Array(MAX_PARTICLES)

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = smoothstep(0.0, 1.0, size / 2.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [])

  const createSplash = (angle: number) => {
    const x = Math.cos(angle) * (wheelRadius - 0.2)
    const y = Math.sin(angle) * (wheelRadius - 0.2)
    const z = (Math.random() - 0.5) * (wheelWidth - 0.4)

    const particleCount = Math.floor(8 + waterSpeed * 15)

    for (let i = 0; i < particleCount; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const velocity = new THREE.Vector3(
        (Math.random() - 0.3) * waterSpeed * 2,
        Math.random() * waterSpeed * 3 + 1,
        (Math.random() - 0.5) * waterSpeed * 1.5
      )

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.3
      )

      const particle: Particle = {
        position: new THREE.Vector3(
          x + wheelPosition[0] + offset.x,
          y + wheelPosition[1] + offset.y,
          z + wheelPosition[2] + offset.z
        ),
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 0.05 + Math.random() * 0.1,
      }

      particlesRef.current.push(particle)
    }
  }

  useFrame((_, delta) => {
    const particles = particlesRef.current
    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color.array as Float32Array
    const sizes = geometry.attributes.size.array as Float32Array

    const gravity = -9.8
    const activeParticles: Particle[] = []

    for (const particle of particles) {
      particle.life += delta
      if (particle.life >= particle.maxLife) continue

      particle.velocity.y += gravity * delta
      particle.position.addScaledVector(particle.velocity, delta)

      if (particle.position.y < wheelPosition[1] - 0.3) {
        particle.velocity.y *= -0.3
        particle.position.y = wheelPosition[1] - 0.3
        particle.velocity.x *= 0.5
        particle.velocity.z *= 0.5
      }

      activeParticles.push(particle)
    }

    particlesRef.current = activeParticles

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < activeParticles.length) {
        const p = activeParticles[i]
        const lifeRatio = p.life / p.maxLife
        const alpha = 1 - lifeRatio

        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z

        const colorMix = Math.min(1, lifeRatio * 2)
        colors[i * 3] = 0.7 + colorMix * 0.3
        colors[i * 3 + 1] = 0.85 + colorMix * 0.15
        colors[i * 3 + 2] = 0.95 + colorMix * 0.05

        sizes[i] = p.size * alpha
      } else {
        positions[i * 3] = 0
        positions[i * 3 + 1] = -100
        positions[i * 3 + 2] = 0
        sizes[i] = 0
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.size.needsUpdate = true
    geometry.setDrawRange(0, Math.min(activeParticles.length, MAX_PARTICLES))

    const wheelAngleSpeed = waterSpeed * 0.8
    const currentAngle = lastSplashAngleRef.current + wheelAngleSpeed * delta
    
    const bladeCount = 12
    const bladeInterval = (Math.PI * 2) / bladeCount
    
    let checkAngle = lastSplashAngleRef.current
    while (checkAngle < currentAngle) {
      const normalizedAngle = checkAngle % (Math.PI * 2)
      const sinAngle = Math.sin(normalizedAngle)
      
      if (sinAngle < -0.3 && sinAngle > -0.8) {
        createSplash(normalizedAngle)
      }
      
      checkAngle += bladeInterval
    }
    
    lastSplashAngleRef.current = currentAngle

    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.uTime.value += delta
    }

    if (activeParticles.length !== particleCount) {
      setParticleCount(activeParticles.length)
    }
  })

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  )
}
