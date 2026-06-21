import { Canvas } from '@react-three/fiber'
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

interface SceneProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

function SceneContent() {
  return (
    <>
      <SceneLighting />
      <Environment streamWidth={8} streamLength={30} />
      <Stream position={[0, -0.5, 0]} length={30} width={8} />
      <WaterWheel position={[-1, 0, 0]} />
      <Mill position={[4.5, 0, 0]} />
      <SplashParticles
        wheelPosition={[-1, 0, 0]}
        wheelRadius={2.5}
        wheelWidth={1.2}
      />

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
