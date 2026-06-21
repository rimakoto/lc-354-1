import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'

interface MillProps {
  position?: [number, number, number]
}

const WOOD_COLOR = '#A0522D'
const DARK_WOOD_COLOR = '#8B4513'
const LIGHT_WOOD_COLOR = '#CD853F'
const STONE_COLOR = '#9E9E9E'
const DARK_STONE_COLOR = '#757575'
const ROOF_COLOR = '#8B0000'

export function Mill({ position = [5, 0, 0] }: MillProps) {
  const millstoneGroupRef = useRef<THREE.Group>(null)
  const mainAxleRef = useRef<THREE.Group>(null)
  const verticalAxleRef = useRef<THREE.Group>(null)
  const gearWheelRef = useRef<THREE.Group>(null)
  const { waterSpeed } = useSceneStore()

  useFrame((_, delta) => {
    if (millstoneGroupRef.current) {
      const rotationSpeed = waterSpeed * 0.5
      millstoneGroupRef.current.rotation.y += rotationSpeed * delta
    }
    if (mainAxleRef.current) {
      const rotationSpeed = waterSpeed * 0.8
      mainAxleRef.current.rotation.x += rotationSpeed * delta
    }
    if (verticalAxleRef.current) {
      const rotationSpeed = waterSpeed * 0.5
      verticalAxleRef.current.rotation.y += rotationSpeed * delta
    }
    if (gearWheelRef.current) {
      const rotationSpeed = waterSpeed * 0.8
      gearWheelRef.current.rotation.x += rotationSpeed * delta
    }
  })

  const createGearTeeth = (radius: number, teethCount: number, toothSize: number) => {
    const teeth = []
    for (let i = 0; i < teethCount; i++) {
      const angle = (i / teethCount) * Math.PI * 2
      teeth.push(
        <mesh key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]} rotation={[0, 0, angle]}>
          <boxGeometry args={[toothSize, toothSize * 0.6, toothSize * 1.2]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
      )
    }
    return teeth
  }

  return (
    <group position={position}>
      <mesh position={[0, 0.05, -1]} receiveShadow>
        <boxGeometry args={[7, 0.1, 8]} />
        <meshStandardMaterial color="#6D4C41" roughness={1} />
      </mesh>

      <group position={[0, 0.5, -0.5]}>
        <mesh position={[0, -0.1, 0]} receiveShadow>
          <cylinderGeometry args={[1.8, 2, 0.5, 32]} />
          <meshStandardMaterial color={DARK_STONE_COLOR} roughness={0.95} />
        </mesh>

        <group ref={millstoneGroupRef}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[1.6, 1.6, 0.35, 32]} />
            <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
          </mesh>

          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[1.55, 1.55, 0.05, 32]} />
            <meshStandardMaterial color={DARK_STONE_COLOR} roughness={0.9} />
          </mesh>

          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.6, 16]} />
            <meshStandardMaterial color="#5D4037" roughness={0.7} />
          </mesh>

          <mesh position={[1.2, 0.5, 0]}>
            <boxGeometry args={[0.8, 0.15, 0.15]} />
            <meshStandardMaterial color="#D32F2F" roughness={0.5} />
          </mesh>
          <mesh position={[-1.2, 0.5, 0]}>
            <boxGeometry args={[0.8, 0.15, 0.15]} />
            <meshStandardMaterial color="#D32F2F" roughness={0.5} />
          </mesh>
        </group>

        <group ref={verticalAxleRef} position={[0, 1.2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, 1.5, 16]} />
            <meshStandardMaterial color={LIGHT_WOOD_COLOR} roughness={0.7} />
          </mesh>
          
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
          </mesh>
          
          {createGearTeeth(0.8, 20, 0.12)}
        </group>

        <mesh position={[1.2, 0.5, 0.8]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.15, 1, 0.15]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>

        <group position={[-2, 1.2, 0]}>
          <group ref={mainAxleRef}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 2.5, 16]} />
              <meshStandardMaterial color={LIGHT_WOOD_COLOR} roughness={0.7} />
            </mesh>
          </group>

          <group ref={gearWheelRef} position={[0, 0, 0.8]}>
            <mesh>
              <cylinderGeometry args={[0.7, 0.7, 0.15, 32]} />
              <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
            </mesh>
            {createGearTeeth(0.7, 18, 0.1)}
          </group>
        </group>

        <mesh position={[-2.2, 0.3, 0]}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
        </mesh>
        <mesh position={[-2.2, 0.3, 1.5]}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
        </mesh>
      </group>

      <group position={[0, 2.2, -3]}>
        <mesh position={[-2.5, 0, 0]}>
          <boxGeometry args={[0.3, 4, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[2.5, 0, 0]}>
          <boxGeometry args={[0.3, 4, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.7, 0.3, 0.3]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[4.7, 0.2, 0.2]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, -1.5, 0]}>
          <boxGeometry args={[4.7, 0.2, 0.2]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>

        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[4.5, 3.5, 0.05]} />
          <meshStandardMaterial color={LIGHT_WOOD_COLOR} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group position={[0, 2.5, -3]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[5, 0.3, 0.5]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[-2.4, 0.5, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[3, 0.15, 0.4]} />
          <meshStandardMaterial color={ROOF_COLOR} roughness={0.6} />
        </mesh>
        <mesh position={[2.4, 0.5, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[3, 0.15, 0.4]} />
          <meshStandardMaterial color={ROOF_COLOR} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.3, 1.5, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
      </group>

      <group position={[-1, 0.6, 1.5]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.6, 0.6, 0.8]} />
          <meshStandardMaterial color={STONE_COLOR} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[0.7, 0.1, 0.9]} />
          <meshStandardMaterial color={DARK_STONE_COLOR} roughness={0.9} />
        </mesh>
      </group>

      <group position={[2, 0.6, 1.5]}>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.5, 0.4, 0.6]} />
          <meshStandardMaterial color="#8D6E63" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color={DARK_STONE_COLOR} roughness={0.9} />
        </mesh>
      </group>

      <mesh position={[0, 0.1, -2.5]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.5, 0.2, 1]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh position={[-1, 0.3, -2.5]}>
        <boxGeometry args={[0.3, 0.6, 0.8]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.8} />
      </mesh>
      <mesh position={[1, 0.3, -2.5]}>
        <boxGeometry args={[0.3, 0.6, 0.8]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.8} />
      </mesh>
    </group>
  )
}
