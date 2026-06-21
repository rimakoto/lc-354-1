import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'

interface WaterWheelProps {
  position?: [number, number, number]
}

const WHEEL_RADIUS = 2.5
const WHEEL_WIDTH = 1.2
const BLADE_COUNT = 12
const WOOD_COLOR = '#8B4513'
const DARK_WOOD_COLOR = '#654321'

export function WaterWheel({ position = [0, 0, 0] }: WaterWheelProps) {
  const wheelGroupRef = useRef<THREE.Group>(null)
  const { waterSpeed } = useSceneStore()

  const blades = useMemo(() => {
    const bladeData = []
    for (let i = 0; i < BLADE_COUNT; i++) {
      const angle = (i / BLADE_COUNT) * Math.PI * 2
      bladeData.push({
        angle,
        isUnderWater: Math.sin(angle) < -0.3,
      })
    }
    return bladeData
  }, [])

  useFrame((_, delta) => {
    if (wheelGroupRef.current) {
      const rotationSpeed = waterSpeed * 0.8
      wheelGroupRef.current.rotation.z += rotationSpeed * delta
    }
  })

  const spokesGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const spoke = new THREE.BoxGeometry(WHEEL_RADIUS * 2 - 0.4, 0.08, 0.08)
      const matrix = new THREE.Matrix4()
      matrix.makeRotationZ(angle)
      spoke.applyMatrix4(matrix)
      geometries.push(spoke)
    }
    return mergeGeometries(geometries)
  }, [])

  return (
    <group position={position}>
      <mesh position={[0, 0, -WHEEL_WIDTH / 2 - 0.1]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, WHEEL_WIDTH / 2 + 0.1]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
        <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
      </mesh>

      <group ref={wheelGroupRef}>
        <mesh position={[0, 0, -WHEEL_WIDTH / 2 + 0.05]}>
          <torusGeometry args={[WHEEL_RADIUS - 0.15, 0.12, 8, 32]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, WHEEL_WIDTH / 2 - 0.05]}>
          <torusGeometry args={[WHEEL_RADIUS - 0.15, 0.12, 8, 32]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>

        <mesh>
          <primitive object={spokesGeometry} attach="geometry" />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>

        {blades.map((blade, i) => {
          const x = Math.cos(blade.angle) * (WHEEL_RADIUS - 0.2)
          const y = Math.sin(blade.angle) * (WHEEL_RADIUS - 0.2)
          return (
            <group key={i} position={[x, y, 0]} rotation={[0, 0, blade.angle + Math.PI / 2]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.15, WHEEL_WIDTH - 0.2, 0.4]} />
                <meshStandardMaterial 
                  color={blade.isUnderWater ? '#5D8AA8' : WOOD_COLOR} 
                  roughness={0.7} 
                />
              </mesh>
              <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <boxGeometry args={[0.08, WHEEL_WIDTH - 0.2, 0.35]} />
                <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
              </mesh>
            </group>
          )
        })}
      </group>

      <group position={[-WHEEL_RADIUS * 0.6, -WHEEL_RADIUS - 0.5, 0]}>
        <mesh position={[-0.8, 1, -WHEEL_WIDTH / 2 - 0.3]}>
          <boxGeometry args={[0.3, 2.5, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[-0.8, 1, WHEEL_WIDTH / 2 + 0.3]}>
          <boxGeometry args={[0.3, 2.5, 0.3]} />
          <meshStandardMaterial color={DARK_WOOD_COLOR} roughness={0.8} />
        </mesh>
        <mesh position={[-0.8, 2.2, 0]}>
          <boxGeometry args={[0.3, 0.3, WHEEL_WIDTH + 1]} />
          <meshStandardMaterial color={WOOD_COLOR} roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  let indexOffset = 0

  geometries.forEach((geo) => {
    const pos = geo.attributes.position
    const nor = geo.attributes.normal
    const uv = geo.attributes.uv
    const idx = geo.index

    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
      }
    }
    if (nor) {
      for (let i = 0; i < nor.count; i++) {
        normals.push(nor.getX(i), nor.getY(i), nor.getZ(i))
      }
    }
    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        uvs.push(uv.getX(i), uv.getY(i))
      }
    }
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + indexOffset)
      }
      indexOffset += pos?.count || 0
    } else {
      for (let i = 0; i < (pos?.count || 0); i++) {
        indices.push(i + indexOffset)
      }
      indexOffset += pos?.count || 0
    }
  })

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  }
  if (uvs.length > 0) {
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }
  merged.setIndex(indices)

  return merged
}
