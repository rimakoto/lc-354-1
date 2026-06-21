import { useMemo } from 'react'
import * as THREE from 'three'

interface EnvironmentProps {
  streamWidth?: number
  streamLength?: number
}

export function Environment({ streamWidth = 8, streamLength = 30 }: EnvironmentProps) {
  const trees = useMemo(() => {
    const treeData = []
    const positions = [
      { x: -8, z: -10 }, { x: -10, z: -5 }, { x: -7, z: 0 },
      { x: -9, z: 5 }, { x: -8, z: 10 }, { x: -11, z: 8 },
      { x: 10, z: -8 }, { x: 12, z: -3 }, { x: 9, z: 2 },
      { x: 11, z: 7 }, { x: 10, z: 12 },
    ]
    
    positions.forEach((pos, i) => {
      const height = 4 + Math.random() * 3
      const scale = 0.8 + Math.random() * 0.4
      treeData.push({
        x: pos.x + (Math.random() - 0.5) * 2,
        z: pos.z + (Math.random() - 0.5) * 2,
        height,
        scale,
        rotation: Math.random() * Math.PI * 2,
        type: i % 3,
      })
    })
    
    return treeData
  }, [])

  const grassPatches = useMemo(() => {
    const patches = []
    for (let i = 0; i < 50; i++) {
      const side = Math.random() > 0.5 ? 1 : -1
      const x = side * (streamWidth / 2 + 1 + Math.random() * 8)
      const z = (Math.random() - 0.5) * (streamLength - 4)
      const scale = 0.3 + Math.random() * 0.5
      patches.push({ x, z, scale })
    }
    return patches
  }, [streamWidth, streamLength])

  const groundGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(40, 40, 50, 50)
    const positions = geometry.attributes.position
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const distFromCenter = Math.abs(x) / (streamWidth / 2 + 2)
      
      let height = 0
      if (Math.abs(x) > streamWidth / 2) {
        const bankHeight = Math.min(1, (Math.abs(x) - streamWidth / 2) * 0.3)
        height = bankHeight + Math.sin(x * 0.5) * 0.2 + Math.sin(y * 0.3) * 0.15
      }
      
      const noise = Math.sin(x * 2) * Math.cos(y * 2) * 0.1
      positions.setZ(i, height + noise)
    }
    
    geometry.computeVertexNormals()
    geometry.rotateX(-Math.PI / 2)
    
    return geometry
  }, [streamWidth])

  return (
    <group>
      <mesh geometry={groundGeometry} receiveShadow position={[0, -0.5, 0]}>
        <meshStandardMaterial color="#6B8E23" roughness={1} />
      </mesh>

      {trees.map((tree, i) => (
        <group
          key={i}
          position={[tree.x, -0.5 + tree.height / 2, tree.z]}
          rotation={[0, tree.rotation, 0]}
          scale={tree.scale}
        >
          <mesh position={[0, -tree.height / 2 + 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          
          {tree.type === 0 && (
            <mesh position={[0, 0.5, 0]} castShadow>
              <coneGeometry args={[1.5, tree.height - 1, 8]} />
              <meshStandardMaterial color="#2E7D32" roughness={0.8} />
            </mesh>
          )}
          {tree.type === 1 && (
            <mesh position={[0, 0.5, 0]} castShadow>
              <sphereGeometry args={[1.3, 8, 8]} />
              <meshStandardMaterial color="#388E3C" roughness={0.8} />
            </mesh>
          )}
          {tree.type === 2 && (
            <>
              <mesh position={[0, 0.3, 0]} castShadow>
                <coneGeometry args={[1.8, tree.height * 0.4, 8]} />
                <meshStandardMaterial color="#2E7D32" roughness={0.8} />
              </mesh>
              <mesh position={[0, 1.2, 0]} castShadow>
                <coneGeometry args={[1.4, tree.height * 0.35, 8]} />
                <meshStandardMaterial color="#388E3C" roughness={0.8} />
              </mesh>
            </>
          )}
        </group>
      ))}

      {grassPatches.map((patch, i) => (
        <mesh
          key={i}
          position={[patch.x, -0.45, patch.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={patch.scale}
        >
          <circleGeometry args={[1, 6]} />
          <meshStandardMaterial color="#558B2F" roughness={1} />
        </mesh>
      ))}

      {[
        { x: -5, z: -8, scale: 0.8 },
        { x: 6, z: 6, scale: 1.2 },
        { x: -7, z: 3, scale: 0.6 },
        { x: 8, z: -5, scale: 1 },
      ].map((rock, i) => (
        <mesh
          key={`ground-rock-${i}`}
          position={[rock.x, -0.3, rock.z]}
          rotation={[Math.random(), Math.random(), Math.random()]}
          scale={rock.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#757575" roughness={0.95} />
        </mesh>
      ))}

      <mesh position={[0, 10, -15]}>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial color="#87CEEB" side={THREE.BackSide} />
      </mesh>
    </group>
  )
}
