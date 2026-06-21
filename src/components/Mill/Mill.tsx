import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'

interface MillProps {
  position?: [number, number, number]
}

const WOOD_COLOR = '#A0522D'
const DARK_WOOD_COLOR = '#8B4513'
const STONE_COLOR = '#808080'
const DARK_STONE_COLOR = '#696969'
const ROOF_COLOR = '#8B0000'

export function Mill({ position = [5, 0, 0] }: MillProps) {
  const millstoneTopRef = useRef<THREE.Mesh>(null)
  const axleRef = useRef<THREE.Group>(null)
  const { waterSpeed } = useSceneStore()

  useFrame((_, delta) => {
    if (millstoneTopRef.current) {
      const rotationSpeed = waterSpeed * 0.3
      millstoneTopRef.current.rotation.y += rotationSpeed * delta
    }
    if (axleRef.current) {
      const rotationSpeed = waterSpeed * 0.8
      axleRef.current.rotation.x += rotationSpeed * delta
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[6, 0.1, 5]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
      </mesh>

      <group position={[0, 1.5, 0]}>
        <mesh position={[-2.7, 0, 0]}>
          <boxGeometry args={[0.3, 3, 4.8]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[2.7, 0, 0]}>
          <boxGeometry args={[0.3, 3, 4.8]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, -2.4]}>
          <boxGeometry args={[5.4, 3, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 2.4]}>
          <boxGeometry args={[5.4, 3, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.7} />
        </mesh>

        <mesh position={[1.5, 0, 2.41]}>
          <boxGeometry args={[1.2, 1.8, 0.1]} />
          <meshStandardMaterial color="#5D4037" roughness={0.8} />
        </mesh>
      </group>

      <group position={[0, 3.2, 0]}>
        <mesh>
          <coneGeometry args={[3.8, 1.8, 4]} />
          <meshStandardMaterial color={ROOF_COLOR} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.5, 0.8, 0.5]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
      </group>

      <group position={[0, 0.6, 0]}>
        <mesh position={[0, 0, 0]} receiveShadow>
          <cylinderGeometry args={[1.5, 1.6, 0.4, 32]} />
          <meshStandardMaterial color={DARK_STONE_COLOR} roughness={0.95} />
        </mesh>

        <mesh ref={millstoneTopRef} position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[1.4, 1.4, 0.3, 32]} />
          <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
        </mesh>

        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.5, 16]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.5} />
        </mesh>

        <mesh position={[0.8, 0.5, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
      </group>

      <group ref={axleRef} position={[-2.8, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.35]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[-2.5, 0.5, 0]}>
        <boxGeometry args={[0.4, 1, 0.4]} />
        <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
      </mesh>
    </group>
  )
}
