import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function SceneLighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null)

  return (
    <>
      <ambientLight intensity={0.4} color="#FFF5E6" />
      
      <directionalLight
        ref={sunRef}
        position={[10, 15, 8]}
        intensity={1.2}
        color="#FFE4B5"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      <pointLight position={[-5, 3, -3]} intensity={0.3} color="#87CEEB" />
      
      <pointLight position={[5, 2, 5]} intensity={0.2} color="#90EE90" />

      <hemisphereLight 
        args={['#87CEEB', '#8B7355', 0.5]} 
      />
    </>
  )
}
