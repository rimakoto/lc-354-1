import { useRef, useMemo, useEffect } from 'react'
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
  type: 'splash' | 'trail' | 'drip'
}

const MAX_PARTICLES = 800

export function SplashParticles({
  wheelPosition = [0, 0, 0],
  wheelRadius = 2.5,
  wheelWidth = 1.2,
}: SplashParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const { waterSpeed } = useSceneStore()
  const particlesRef = useRef<Particle[]>([])
  const lastBladeAnglesRef = useRef<number[]>([])
  const waterSurfaceY = -0.3

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
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = smoothstep(0.0, 1.0, size / 3.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * vAlpha * 0.9;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: geo, material: mat }
  }, [])

  const createEntrySplash = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * wheelRadius
    const bladeY = Math.sin(bladeAngle) * wheelRadius
    
    const count = Math.floor(20 + waterSpeed * 40)
    
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const spreadX = (Math.random() - 0.5) * 0.8
      const spreadZ = (Math.random() - 0.5) * (wheelWidth - 0.2)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.2) * waterSpeed * 3 - 1,
        Math.random() * waterSpeed * 5 + 2,
        (Math.random() - 0.5) * waterSpeed * 2
      )

      const particle: Particle = {
        position: new THREE.Vector3(
          bladeX + wheelPosition[0] + spreadX,
          waterSurfaceY + 0.05,
          wheelPosition[2] + spreadZ
        ),
        velocity,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
        size: 0.08 + Math.random() * 0.15,
        type: 'splash',
      }

      particlesRef.current.push(particle)
    }
  }

  const createExitSplash = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * wheelRadius
    const bladeY = Math.sin(bladeAngle) * wheelRadius
    
    const count = Math.floor(15 + waterSpeed * 30)
    
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const spreadX = (Math.random() - 0.5) * 0.6
      const spreadZ = (Math.random() - 0.5) * (wheelWidth - 0.3)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.3) * waterSpeed * 2 + 0.5,
        Math.random() * waterSpeed * 4 + 1.5,
        (Math.random() - 0.5) * waterSpeed * 2.5
      )

      const particle: Particle = {
        position: new THREE.Vector3(
          bladeX + wheelPosition[0] + spreadX,
          waterSurfaceY + 0.1,
          wheelPosition[2] + spreadZ
        ),
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 0.06 + Math.random() * 0.12,
        type: 'splash',
      }

      particlesRef.current.push(particle)
    }
  }

  const createTrailParticle = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * (wheelRadius - 0.3)
    const bladeY = Math.sin(bladeAngle) * (wheelRadius - 0.3)
    
    if (bladeY > waterSurfaceY - 0.1 && bladeY < waterSurfaceY + 1.5) {
      const count = Math.floor(2 + waterSpeed * 4)
      
      for (let i = 0; i < count; i++) {
        if (particlesRef.current.length >= MAX_PARTICLES) break

        const spreadZ = (Math.random() - 0.5) * (wheelWidth - 0.4)
        
        const velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * waterSpeed * 2 + 0.5,
          (Math.random() - 0.5) * 0.5
        )

        const particle: Particle = {
          position: new THREE.Vector3(
            bladeX + wheelPosition[0] + (Math.random() - 0.5) * 0.2,
            bladeY + wheelPosition[1],
            wheelPosition[2] + spreadZ
          ),
          velocity,
          life: 0,
          maxLife: 0.4 + Math.random() * 0.3,
          size: 0.04 + Math.random() * 0.08,
          type: 'trail',
        }

        particlesRef.current.push(particle)
      }
    }
  }

  useFrame((state, delta) => {
    const particles = particlesRef.current
    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color.array as Float32Array
    const sizes = geometry.attributes.size.array as Float32Array

    const gravity = -12
    const activeParticles: Particle[] = []

    for (const particle of particles) {
      particle.life += delta
      if (particle.life >= particle.maxLife) continue

      if (particle.type !== 'trail') {
        particle.velocity.y += gravity * delta
      } else {
        particle.velocity.y += gravity * 0.5 * delta
        particle.velocity.x *= 0.98
        particle.velocity.z *= 0.98
      }
      
      particle.position.addScaledVector(particle.velocity, delta)

      if (particle.position.y < wheelPosition[1] + waterSurfaceY) {
        if (particle.type === 'splash' && particle.life < particle.maxLife * 0.6) {
          particle.velocity.y *= -0.2
          particle.position.y = wheelPosition[1] + waterSurfaceY
          particle.velocity.x *= 0.6
          particle.velocity.z *= 0.6
        } else {
          continue
        }
      }

      activeParticles.push(particle)
    }

    particlesRef.current = activeParticles

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < activeParticles.length) {
        const p = activeParticles[i]
        const lifeRatio = p.life / p.maxLife
        const alpha = lifeRatio < 0.3 ? lifeRatio / 0.3 : 1 - (lifeRatio - 0.3) / 0.7

        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z

        if (p.type === 'splash') {
          colors[i * 3] = 0.8
          colors[i * 3 + 1] = 0.92
          colors[i * 3 + 2] = 1.0
        } else {
          colors[i * 3] = 0.7
          colors[i * 3 + 1] = 0.85
          colors[i * 3 + 2] = 0.95
        }

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

    const wheelRotation = state.clock.elapsedTime * waterSpeed * 0.8
    const bladeCount = 12
    const bladeAngleStep = (Math.PI * 2) / bladeCount

    if (lastBladeAnglesRef.current.length === 0) {
      for (let i = 0; i < bladeCount; i++) {
        lastBladeAnglesRef.current.push(i * bladeAngleStep)
      }
    }

    for (let i = 0; i < bladeCount; i++) {
      const prevAngle = lastBladeAnglesRef.current[i]
      const currentAngle = i * bladeAngleStep + wheelRotation
      
      const prevSin = Math.sin(prevAngle)
      const currSin = Math.sin(currentAngle)
      
      const waterLineSin = waterSurfaceY / wheelRadius
      
      if (prevSin > waterLineSin && currSin <= waterLineSin) {
        createEntrySplash(currentAngle)
      }
      
      if (prevSin < waterLineSin && currSin >= waterLineSin) {
        createExitSplash(currentAngle)
      }
      
      if (currSin < waterLineSin + 0.1 && currSin > waterLineSin - 0.5) {
        createTrailParticle(currentAngle)
      }
      
      lastBladeAnglesRef.current[i] = currentAngle
    }

    if (material instanceof THREE.ShaderMaterial) {
      material.uniforms.uTime.value += delta
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
