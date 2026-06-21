import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'

interface StreamProps {
  position?: [number, number, number]
  length?: number
  width?: number
}

export function Stream({ position = [0, -0.5, 0], length = 30, width = 8 }: StreamProps) {
  const waterRef = useRef<THREE.Mesh>(null)
  const { waterSpeed } = useSceneStore()

  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.5 },
        uColor: { value: new THREE.Color('#4A90A4') },
        uFoamColor: { value: new THREE.Color('#FFFFFF') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uSpeed;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          vec3 pos = position;
          float wave1 = sin(pos.x * 2.0 + uTime * uSpeed * 2.0) * 0.05;
          float wave2 = sin(pos.x * 3.5 + uTime * uSpeed * 3.0) * 0.03;
          float wave3 = sin(pos.z * 1.5 + uTime * uSpeed * 1.5) * 0.04;
          pos.y += wave1 + wave2 + wave3;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uTime;
        uniform float uSpeed;
        uniform vec3 uColor;
        uniform vec3 uFoamColor;
        
        void main() {
          vec2 uv = vUv;
          
          float flow = uv.x + uTime * uSpeed * 0.3;
          float ripple1 = sin(flow * 20.0) * 0.5 + 0.5;
          float ripple2 = sin(flow * 35.0 + uv.y * 10.0) * 0.3 + 0.7;
          
          float foam = smoothstep(0.7, 0.9, ripple1 * ripple2);
          
          vec3 waterColor = uColor * (0.7 + ripple1 * 0.3);
          vec3 finalColor = mix(waterColor, uFoamColor, foam * 0.3);
          
          float depth = 0.7 + sin(uv.y * 5.0 + uTime * uSpeed) * 0.1;
          finalColor *= depth;
          
          gl_FragColor = vec4(finalColor, 0.85);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [])

  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uSpeed.value = waterSpeed
    }
  })

  const streamBedGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width + 1, length, 20, 60)
    const positions = geometry.attributes.position
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getY(i)
      const distFromCenter = Math.abs(x) / (width / 2)
      const depth = -0.3 - (1 - distFromCenter) * 0.5
      const rocks = Math.sin(x * 3) * Math.cos(z * 2) * 0.1
      positions.setZ(i, depth + rocks)
    }
    
    geometry.computeVertexNormals()
    geometry.rotateX(-Math.PI / 2)
    
    return geometry
  }, [width, length])

  const rocks = useMemo(() => {
    const rockData = []
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * (width - 2)
      const z = (Math.random() - 0.5) * (length - 4)
      const scale = 0.2 + Math.random() * 0.4
      const rotation = Math.random() * Math.PI * 2
      const color = Math.random() > 0.5 ? '#6B6B6B' : '#5A5A5A'
      rockData.push({ x, z, scale, rotation, color })
    }
    return rockData
  }, [width, length])

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <primitive object={streamBedGeometry} attach="geometry" />
        <meshStandardMaterial color="#5D4E37" roughness={1} />
      </mesh>

      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[width, length, 1, 1]} />
        <primitive object={waterMaterial} attach="material" />
      </mesh>

      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={[rock.x, -0.2 + rock.scale * 0.3, rock.z]}
          rotation={[rock.rotation * 0.3, rock.rotation, rock.rotation * 0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[rock.scale, 0]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} />
        </mesh>
      ))}

      <mesh position={[0, -0.1, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width + 1, 0.5, 0.5]} />
        <meshStandardMaterial color="#4A3728" roughness={1} />
      </mesh>
      <mesh position={[0, -0.1, length / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[width + 1, 0.5, 0.5]} />
        <meshStandardMaterial color="#4A3728" roughness={1} />
      </mesh>
    </group>
  )
}
