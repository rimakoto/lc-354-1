import { useMemo } from 'react'
import * as THREE from 'three'

interface EnvironmentProps {
  streamWidth?: number
  streamLength?: number
}

export function Environment({ streamWidth = 8, streamLength = 30 }: EnvironmentProps) {
  const farTrees = useMemo(() => {
    const treeData = []
    for (let ring = 0; ring < 3; ring++) {
      const radius = 18 + ring * 6
      const count = 24 + ring * 8
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
        const x = Math.cos(angle) * (radius + Math.random() * 4)
        const z = Math.sin(angle) * (radius + Math.random() * 4)
        if (Math.abs(x) < streamWidth / 2 + 2 && Math.abs(z) < streamLength / 2 + 2) continue
        const height = 3 + Math.random() * 5
        const scale = 0.6 + Math.random() * 0.8
        treeData.push({
          x, z, height, scale,
          rotation: Math.random() * Math.PI * 2,
          type: Math.floor(Math.random() * 3),
        })
      }
    }
    return treeData
  }, [streamWidth, streamLength])

  const nearTrees = useMemo(() => {
    const treeData = []
    const positions = [
      { x: -10, z: -10 }, { x: -12, z: -5 }, { x: -8, z: -2 },
      { x: -11, z: 3 }, { x: -9, z: 8 }, { x: -13, z: 10 },
      { x: 14, z: -9 }, { x: 16, z: -2 }, { x: 12, z: 4 },
      { x: 15, z: 9 }, { x: 13, z: 12 },
      { x: -6, z: -12 }, { x: 8, z: -11 },
      { x: -7, z: 13 }, { x: 10, z: 14 },
    ]
    positions.forEach((pos, i) => {
      const height = 4 + Math.random() * 3
      const scale = 0.8 + Math.random() * 0.5
      treeData.push({
        x: pos.x + (Math.random() - 0.5) * 2,
        z: pos.z + (Math.random() - 0.5) * 2,
        height, scale,
        rotation: Math.random() * Math.PI * 2,
        type: i % 3,
      })
    })
    return treeData
  }, [])

  const grassPatches = useMemo(() => {
    const patches = []
    for (let i = 0; i < 80; i++) {
      const side = Math.random() > 0.5 ? 1 : -1
      const x = side * (streamWidth / 2 + 0.5 + Math.random() * 15)
      const z = (Math.random() - 0.5) * (streamLength + 10)
      const scale = 0.3 + Math.random() * 0.7
      patches.push({ x, z, scale })
    }
    return patches
  }, [streamWidth, streamLength])

  const groundGeometry = useMemo(() => {
    const geometry = new THREE.CircleGeometry(60, 80)
    const positions = geometry.attributes.position
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getY(i)
      const distFromOrigin = Math.sqrt(x * x + z * z)
      
      const distFromStreamX = Math.abs(x) - streamWidth / 2
      
      let height = 0
      
      if (distFromStreamX > 0) {
        const bankSlope = Math.min(distFromStreamX * 0.15, 0.8)
        height = bankSlope
      } else {
        const streamDepth = (1 - Math.abs(distFromStreamX) / (streamWidth / 2)) * 0.6
        height = -streamDepth
      }
      
      const noise1 = Math.sin(x * 0.3) * Math.cos(z * 0.25) * 0.15
      const noise2 = Math.sin(x * 0.8 + 1) * Math.cos(z * 0.6) * 0.08
      const edgeFalloff = Math.max(0, (distFromOrigin - 45) / 15) * 2
      
      height += noise1 + noise2 - edgeFalloff
      
      positions.setZ(i, height)
    }
    
    geometry.computeVertexNormals()
    geometry.rotateX(-Math.PI / 2)
    
    return geometry
  }, [streamWidth])

  const hillsGeometry = useMemo(() => {
    const geometry = new THREE.CircleGeometry(55, 60)
    const positions = geometry.attributes.position
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getY(i)
      const dist = Math.sqrt(x * x + z * z)
      
      if (dist < 25) {
        positions.setZ(i, -10)
      } else {
        const hillFactor = (dist - 25) / 30
        const hills = Math.sin(x * 0.1) * Math.cos(z * 0.08) * 3
                        + Math.sin(x * 0.05 + 2) * Math.cos(z * 0.06) * 4
                        + Math.sin(x * 0.2) * 0.5
        positions.setZ(i, hills * hillFactor + hillFactor * 6 - 2)
      }
    }
    
    geometry.computeVertexNormals()
    geometry.rotateX(-Math.PI / 2)
    
    return geometry
  }, [])

  const rocks = useMemo(() => {
    const rockData = []
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 1 : -1
      const x = side * (streamWidth / 2 + 1 + Math.random() * 8)
      const z = (Math.random() - 0.5) * (streamLength - 2)
      const scale = 0.3 + Math.random() * 0.8
      rockData.push({
        x, z, scale,
        rotation: Math.random() * Math.PI * 2,
        color: Math.random() > 0.5 ? '#757575' : '#616161',
      })
    }
    return rockData
  }, [streamWidth, streamLength])

  return (
    <group>
      <mesh geometry={groundGeometry} receiveShadow position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#558B2F" roughness={1} />
      </mesh>

      <mesh geometry={hillsGeometry} position={[0, -0.5, 0]} receiveShadow>
        <meshStandardMaterial color="#4A6B2A" roughness={1} />
      </mesh>

      <mesh position={[0, 50, 0]}>
        <sphereGeometry args={[80, 48, 32]} />
        <meshBasicMaterial color="#B0E0FF" side={THREE.BackSide} />
      </mesh>

      <mesh position={[0, 45, 0]}>
        <sphereGeometry args={[75, 32, 24]} />
        <meshBasicMaterial color="#E8F4FF" side={THREE.BackSide} transparent opacity={0.5} />
      </mesh>

      {[...nearTrees, ...farTrees].map((tree, i) => (
        <group
          key={i}
          position={[tree.x, -0.5 + tree.height / 2, tree.z]}
          rotation={[0, tree.rotation, 0]}
          scale={tree.scale}
        >
          <mesh position={[0, -tree.height / 2 + 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.35, tree.height * 0.35, 8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.95} />
          </mesh>
          
          {tree.type === 0 && (
            <mesh position={[0, tree.height * 0.1, 0]} castShadow>
              <coneGeometry args={[tree.height * 0.4, tree.height * 0.7, 8]} />
              <meshStandardMaterial color="#2E7D32" roughness={0.85} />
            </mesh>
          )}
          {tree.type === 1 && (
            <mesh position={[0, tree.height * 0.1, 0]} castShadow>
              <sphereGeometry args={[tree.height * 0.38, 8, 8]} />
              <meshStandardMaterial color="#388E3C" roughness={0.85} />
            </mesh>
          )}
          {tree.type === 2 && (
            <>
              <mesh position={[0, -tree.height * 0.05, 0]} castShadow>
                <coneGeometry args={[tree.height * 0.45, tree.height * 0.35, 8]} />
                <meshStandardMaterial color="#2E7D32" roughness={0.85} />
              </mesh>
              <mesh position={[0, tree.height * 0.15, 0]} castShadow>
                <coneGeometry args={[tree.height * 0.35, tree.height * 0.3, 8]} />
                <meshStandardMaterial color="#388E3C" roughness={0.85} />
              </mesh>
              <mesh position={[0, tree.height * 0.3, 0]} castShadow>
                <coneGeometry args={[tree.height * 0.25, tree.height * 0.25, 8]} />
                <meshStandardMaterial color="#43A047" roughness={0.85} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {grassPatches.map((patch, i) => (
        <mesh
          key={i}
          position={[patch.x, -0.45, patch.z]}
          rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
          scale={patch.scale}
        >
          <circleGeometry args={[1.2, 6]} />
          <meshStandardMaterial color="#689F38" roughness={1} />
        </mesh>
      ))}

      {rocks.map((rock, i) => (
        <mesh
          key={`ground-rock-${i}`}
          position={[rock.x, -0.35, rock.z]}
          rotation={[rock.rotation * 0.4, rock.rotation, rock.rotation * 0.3]}
          scale={rock.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} />
        </mesh>
      ))}

      {[
        { x: -streamWidth / 2 - 0.3, z: -streamLength / 2 - 1, rotZ: 0.1 },
        { x: streamWidth / 2 + 0.3, z: -streamLength / 2 - 1, rotZ: -0.1 },
        { x: -streamWidth / 2 - 0.3, z: streamLength / 2 + 1, rotZ: -0.1 },
        { x: streamWidth / 2 + 0.3, z: streamLength / 2 + 1, rotZ: 0.1 },
      ].map((stone, i) => (
        <mesh
          key={`bank-stone-${i}`}
          position={[stone.x, -0.2, stone.z]}
          rotation={[0, 0, stone.rotZ]}
          scale={[0.6, 1, 0.8]}
          castShadow
        >
          <boxGeometry args={[1, 0.8, 1.5]} />
          <meshStandardMaterial color="#6D4C41" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
