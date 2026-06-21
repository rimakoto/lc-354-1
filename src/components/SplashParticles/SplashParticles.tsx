import { useRef, useMemo, useEffect, useState } from 'react'
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
  type: 'splash' | 'lift' | 'spray' | 'drip' | 'sheet'
}

const MAX_PARTICLES = 1500

export function SplashParticles({
  wheelPosition = [0, 0, 0],
  wheelRadius = 2.5,
  wheelWidth = 1.2,
}: SplashParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const dripMeshesRef = useRef<THREE.InstancedMesh>(null)
  const { waterSpeed } = useSceneStore()
  const particlesRef = useRef<Particle[]>([])
  const lastBladeAnglesRef = useRef<number[]>([])
  const bladeDripPositionsRef = useRef<Map<number, number[]>>(new Map())
  const waterSurfaceY = -0.45
  const [dripCount, setDripCount] = useState(0)
  const dummyObj = useMemo(() => new THREE.Object3D(), [])

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
        varying float vSize;
        
        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (600.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = clamp(size / 0.5, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        varying float vSize;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float core = 1.0 - smoothstep(0.0, 0.2, dist);
          float outer = 1.0 - smoothstep(0.2, 0.5, dist);
          
          float alpha = (core * 0.9 + outer * 0.4) * vAlpha;
          
          vec3 finalColor = mix(vColor, vec3(1.0), core * 0.6);
          
          gl_FragColor = vec4(finalColor, alpha * 0.95);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })

    return { geometry: geo, material: mat }
  }, [])

  const dripGeometry = useMemo(() => new THREE.SphereGeometry(1, 8, 8), [])
  const dripMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#E0F4FF',
    transparent: true,
    opacity: 0.9,
    roughness: 0.1,
    metalness: 0.1,
    emissive: '#A0D8EF',
    emissiveIntensity: 0.2,
  }), [])

  const createEntrySplash = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * wheelRadius
    const count = Math.floor(30 + waterSpeed * 60)
    
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const spreadX = (Math.random() - 0.5) * 1.2
      const spreadZ = (Math.random() - 0.5) * (wheelWidth + 0.5)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.3) * waterSpeed * 4 - 1.5,
        Math.random() * waterSpeed * 7 + 2.5,
        (Math.random() - 0.5) * waterSpeed * 3
      )

      const type: Particle['type'] = i < count * 0.3 ? 'splash' : (i < count * 0.6 ? 'spray' : 'sheet')

      const particle: Particle = {
        position: new THREE.Vector3(
          bladeX + wheelPosition[0] + spreadX,
          wheelPosition[1] + waterSurfaceY + 0.05,
          wheelPosition[2] + spreadZ
        ),
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.7,
        size: 0.08 + Math.random() * 0.18,
        type,
      }

      particlesRef.current.push(particle)
    }
  }

  const createExitSplash = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * wheelRadius
    const count = Math.floor(25 + waterSpeed * 50)
    
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const spreadX = (Math.random() - 0.5) * 0.9
      const spreadZ = (Math.random() - 0.5) * (wheelWidth - 0.1)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.4) * waterSpeed * 3 + 0.8,
        Math.random() * waterSpeed * 6 + 2,
        (Math.random() - 0.5) * waterSpeed * 3.5
      )

      const type: Particle['type'] = i < count * 0.4 ? 'lift' : 'drip'

      const particle: Particle = {
        position: new THREE.Vector3(
          bladeX + wheelPosition[0] + spreadX,
          wheelPosition[1] + waterSurfaceY + 0.15,
          wheelPosition[2] + spreadZ
        ),
        velocity,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.6,
        size: 0.1 + Math.random() * 0.2,
        type,
      }

      particlesRef.current.push(particle)
    }

    const dripPositions = []
    for (let j = 0; j < 5; j++) {
      dripPositions.push(
        bladeX + wheelPosition[0] + (Math.random() - 0.5) * 0.5,
        wheelPosition[1] + wheelRadius * 0.5,
        wheelPosition[2] + (Math.random() - 0.5) * (wheelWidth - 0.2)
      )
    }
    bladeDripPositionsRef.current.set(bladeAngle, dripPositions)
  }

  const createLiftTrail = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * (wheelRadius - 0.2)
    const bladeY = Math.sin(bladeAngle) * (wheelRadius - 0.2)
    
    const relY = bladeY - waterSurfaceY
    if (relY < -0.1 || relY > wheelRadius * 0.8) return
    
    const count = Math.floor(3 + waterSpeed * 8)
    
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const spreadZ = (Math.random() - 0.5) * (wheelWidth - 0.3)
      
      const tangentialSpeed = waterSpeed * 2
      const tangentAngle = bladeAngle + Math.PI / 2
      const velocity = new THREE.Vector3(
        Math.cos(tangentAngle) * tangentialSpeed + (Math.random() - 0.5) * 0.5,
        Math.sin(tangentAngle) * tangentialSpeed + Math.random() * 1.5 + 0.5,
        (Math.random() - 0.5) * 0.8
      )

      const particle: Particle = {
        position: new THREE.Vector3(
          bladeX + wheelPosition[0] + (Math.random() - 0.5) * 0.15,
          bladeY + wheelPosition[1],
          wheelPosition[2] + spreadZ
        ),
        velocity,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 0.06 + Math.random() * 0.12,
        type: 'lift',
      }

      particlesRef.current.push(particle)
    }
  }

  const createSheetWater = (bladeAngle: number) => {
    const bladeX = Math.cos(bladeAngle) * (wheelRadius - 0.2)
    const bladeY = Math.sin(bladeAngle) * (wheelRadius - 0.2)
    
    const relY = bladeY - waterSurfaceY
    if (relY < 0.3 || relY > wheelRadius * 0.6) return
    
    const count = Math.floor(2 + waterSpeed * 5)
    
    for (let i = 0; i < count; i++) {
      if (particlesRef.current.length >= MAX_PARTICLES) break

      const t = i / Math.max(count - 1, 1)
      const spreadZ = -wheelWidth / 2 + t * (wheelWidth - 0.2)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * waterSpeed * 2 + 0.5,
        (Math.random() - 0.5) * 0.3
      )

      const particle: Particle = {
        position: new THREE.Vector3(
          bladeX + wheelPosition[0],
          bladeY + wheelPosition[1] - 0.1,
          spreadZ
        ),
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        size: 0.12 + Math.random() * 0.15,
        type: 'sheet',
      }

      particlesRef.current.push(particle)
    }
  }

  useFrame((state, delta) => {
    const particles = particlesRef.current
    const positions = geometry.attributes.position.array as Float32Array
    const colors = geometry.attributes.color.array as Float32Array
    const sizes = geometry.attributes.size.array as Float32Array

    const gravity = -14
    const activeParticles: Particle[] = []
    const visibleDrips: Particle[] = []

    for (const particle of particles) {
      particle.life += delta
      if (particle.life >= particle.maxLife) continue

      if (particle.type === 'splash' || particle.type === 'spray') {
        particle.velocity.y += gravity * delta
        particle.velocity.x *= 0.995
        particle.velocity.z *= 0.995
      } else if (particle.type === 'lift') {
        particle.velocity.y += gravity * 0.7 * delta
        particle.velocity.x *= 0.98
        particle.velocity.z *= 0.98
      } else if (particle.type === 'drip') {
        particle.velocity.y += gravity * delta
      } else if (particle.type === 'sheet') {
        particle.velocity.y += gravity * 0.5 * delta
        particle.velocity.x *= 0.97
        particle.velocity.z *= 0.97
      }
      
      particle.position.addScaledVector(particle.velocity, delta)

      if (particle.position.y < wheelPosition[1] + waterSurfaceY) {
        if (particle.life < particle.maxLife * 0.5 && particle.type === 'splash') {
          particle.velocity.y *= -0.25
          particle.position.y = wheelPosition[1] + waterSurfaceY
          particle.velocity.x *= 0.5
          particle.velocity.z *= 0.5
        } else {
          continue
        }
      }

      activeParticles.push(particle)
      
      if (particle.type === 'drip' && particle.size > 0.15 && particle.life > particle.maxLife * 0.2) {
        visibleDrips.push(particle)
      }
    }

    particlesRef.current = activeParticles

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < activeParticles.length) {
        const p = activeParticles[i]
        const lifeRatio = p.life / p.maxLife
        const fadeIn = Math.min(1, lifeRatio * 5)
        const fadeOut = 1 - Math.max(0, (lifeRatio - 0.5) / 0.5)
        const alpha = fadeIn * fadeOut

        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z

        if (p.type === 'splash' || p.type === 'spray') {
          colors[i * 3] = 0.85
          colors[i * 3 + 1] = 0.95
          colors[i * 3 + 2] = 1.0
        } else if (p.type === 'lift') {
          colors[i * 3] = 0.8
          colors[i * 3 + 1] = 0.92
          colors[i * 3 + 2] = 1.0
        } else if (p.type === 'sheet') {
          colors[i * 3] = 0.75
          colors[i * 3 + 1] = 0.88
          colors[i * 3 + 2] = 0.98
        } else {
          colors[i * 3] = 0.9
          colors[i * 3 + 1] = 0.97
          colors[i * 3 + 2] = 1.0
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

    if (dripMeshesRef.current) {
      const maxDrips = 50
      const dripRenderCount = Math.min(visibleDrips.length, maxDrips)
      
      for (let i = 0; i < dripRenderCount; i++) {
        const p = visibleDrips[i]
        const lifeRatio = p.life / p.maxLife
        const scale = p.size * Math.min(1, lifeRatio * 3) * (1 - Math.max(0, (lifeRatio - 0.6) / 0.4))
        
        dummyObj.position.copy(p.position)
        dummyObj.scale.setScalar(scale)
        dummyObj.updateMatrix()
        dripMeshesRef.current.setMatrixAt(i, dummyObj.matrix)
      }
      dripMeshesRef.current.count = dripRenderCount
      dripMeshesRef.current.instanceMatrix.needsUpdate = true
      
      if (dripRenderCount !== dripCount) setDripCount(dripRenderCount)
    }

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
      
      if (currSin > waterLineSin && currSin < waterLineSin + 0.8) {
        createLiftTrail(currentAngle)
        createSheetWater(currentAngle)
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
      dripGeometry.dispose()
      dripMaterial.dispose()
    }
  }, [geometry, material, dripGeometry, dripMaterial])

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} />
      <instancedMesh
        ref={dripMeshesRef}
        args={[dripGeometry, dripMaterial, 50]}
      />
    </group>
  )
}
