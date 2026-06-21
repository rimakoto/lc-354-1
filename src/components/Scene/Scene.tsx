import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { WaterWheel } from '@/components/WaterWheel/WaterWheel'
import { Mill } from '@/components/Mill/Mill'
import { Stream } from '@/components/Stream/Stream'
import { SplashParticles } from '@/components/SplashParticles/SplashParticles'
import { SceneLighting } from '@/components/SceneLighting/SceneLighting'
import { Environment } from '@/components/Environment/Environment'
import { useSceneStore } from '@/store/useSceneStore'

interface SceneProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

function DriveShaft() {
  const shaftRef = useRef<THREE.Group>(null)
  const { waterSpeed } = useSceneStore()

  useFrame((_, delta) => {
    if (shaftRef.current) {
      shaftRef.current.rotation.z += waterSpeed * 0.8 * delta
    }
  })

  return (
    <>
      <group ref={shaftRef} position={[1.5, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 3.5, 16]} />
          <meshStandardMaterial color="#CD853F" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, -1.7]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 1.7]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[1.5, -0.3, -1.5]}>
        <boxGeometry args={[0.4, 0.8, 0.4]} />
        <meshStandardMaterial color="#808080" roughness={0.9} />
      </mesh>
      <mesh position={[1.5, -0.3, 1.5]}>
        <boxGeometry args={[0.4, 0.8, 0.4]} />
        <meshStandardMaterial color="#808080" roughness={0.9} />
      </mesh>

      <mesh position={[1.5, 0.05, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <mesh position={[1.5, 0.05, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
    </>
  )
}

function SceneContent() {
  return (
    <>
      <SceneLighting />
      <Environment streamWidth={8} streamLength={30} />
      <Stream position={[0, -0.5, 0]} length={30} width={8} />
      <WaterWheel position={[-1, 0, 0]} />
      <Mill position={[3.5, 0, 0]} />
      <SplashParticles
        wheelPosition={[-1, 0, 0]}
        wheelRadius={2.5}
        wheelWidth={1.2}
      />
      <DriveShaft />

      <EffectComposer>
        <Bloom 
          intensity={0.3} 
          luminanceThreshold={0.8} 
          luminanceSmoothing={0.9} 
          mipmapBlur 
        />
      </EffectComposer>
    </>
  )
}

export function Scene({ controlsRef }: SceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 5, 10], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 20, 50]} />
      
      <SceneContent />
      
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.2}
        target={[2, 1, 0]}
      />
    </Canvas>
  )
}
