import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/store/useSceneStore'

interface StreamProps {
  position?: [number, number, number]
  length?: number
  width?: number
}

export function Stream({ position = [0, -0.5, 0], length = 40, width = 8 }: StreamProps) {
  const waterRef = useRef<THREE.Mesh>(null)
  const foamRef1 = useRef<THREE.Mesh>(null)
  const foamRef2 = useRef<THREE.Mesh>(null)
  const { waterSpeed } = useSceneStore()

  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.5 },
        uColor: { value: new THREE.Color('#5BA3B8') },
        uFoamColor: { value: new THREE.Color('#FFFFFF') },
        uDeepColor: { value: new THREE.Color('#2E6B7D') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform float uSpeed;
        
        void main() {
          vUv = uv;
          
          vec3 pos = position;
          float wave1 = sin(pos.x * 1.5 + uTime * uSpeed * 1.8) * 0.04;
          float wave2 = sin(pos.x * 3.0 + uTime * uSpeed * 2.5 + 1.0) * 0.025;
          float wave3 = sin(pos.z * 2.0 + uTime * uSpeed * 1.2) * 0.03;
          pos.y += wave1 + wave2 + wave3;
          
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        uniform float uTime;
        uniform float uSpeed;
        uniform vec3 uColor;
        uniform vec3 uFoamColor;
        uniform vec3 uDeepColor;
        
        void main() {
          vec2 uv = vUv;
          
          float flow1 = uv.y + uTime * uSpeed * 0.25;
          float flow2 = uv.y * 2.0 + uTime * uSpeed * 0.4;
          
          float ripple1 = sin(flow1 * 15.0 + uv.x * 8.0) * 0.5 + 0.5;
          float ripple2 = sin(flow2 * 25.0 + uv.x * 12.0) * 0.3 + 0.7;
          float ripple3 = sin(flow1 * 40.0 + uv.x * 20.0 + uTime * 2.0) * 0.2;
          
          float foam = smoothstep(0.65, 0.85, ripple1 * ripple2 + ripple3);
          
          float depthMix = smoothstep(0.0, 1.0, abs(uv.x - 0.5) * 2.0);
          vec3 baseColor = mix(uColor, uDeepColor, 0.3 + depthMix * 0.4);
          
          vec3 waterColor = baseColor * (0.75 + ripple1 * 0.25);
          vec3 finalColor = mix(waterColor, uFoamColor, foam * 0.35);
          
          float sparkle = pow(sin(flow1 * 50.0 + uTime * 3.0) * 0.5 + 0.5, 8.0) * 0.15;
          finalColor += vec3(sparkle);
          
          float alpha = 0.88;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [])

  const foamMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.5 },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSpeed;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(pos.x * 3.0 + uTime * uSpeed * 2.0) * 0.02;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uSpeed;
        
        void main() {
          float flow = vUv.y + uTime * uSpeed * 0.3;
          float foam = sin(flow * 30.0 + vUv.x * 15.0) * 0.5 + 0.5;
          foam += sin(flow * 50.0 + vUv.x * 25.0 + 1.0) * 0.3;
          foam = smoothstep(0.4, 0.9, foam);
          
          float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
          
          vec3 color = vec3(0.95, 0.98, 1.0);
          float alpha = foam * edge * 0.5;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame((state) => {
    if (waterRef.current) {
      const material = waterRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uSpeed.value = waterSpeed
    }
    if (foamRef1.current) {
      const material = foamRef1.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uSpeed.value = waterSpeed
    }
    if (foamRef2.current) {
      const material = foamRef2.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uSpeed.value = waterSpeed
    }
  })

  const streamBedGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width + 4, length + 4, 40, 100)
    const positions = geometry.attributes.position
    const uvs = geometry.attributes.uv
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getY(i)
      const distFromCenter = Math.abs(x) / (width / 2)
      
      let depth = 0
      if (distFromCenter < 1) {
        depth = -0.25 - (1 - distFromCenter) * 0.5
      } else {
        const bankDist = distFromCenter - 1
        depth = -0.25 + Math.min(bankDist * 0.5, 0.8)
      }
      
      const rocks = Math.sin(x * 4) * Math.cos(z * 2.5) * 0.08
                  + Math.sin(x * 2 + 1) * Math.cos(z * 4 + 0.5) * 0.05
      const noise = Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.05
      
      positions.setZ(i, depth + rocks + noise)
    }
    
    geometry.computeVertexNormals()
    geometry.rotateX(-Math.PI / 2)
    
    return geometry
  }, [width, length])

  const rocks = useMemo(() => {
    const rockData = []
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * (width - 1)
      const z = (Math.random() - 0.5) * (length - 4)
      const scale = 0.15 + Math.random() * 0.5
      const rotation = Math.random() * Math.PI * 2
      const color = Math.random() > 0.5 ? '#6B6B6B' : '#5A5A5A'
      rockData.push({ x, z, scale, rotation, color })
    }
    return rockData
  }, [width, length])

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <primitive object={streamBedGeometry} attach="geometry" />
        <meshStandardMaterial color="#5D4E37" roughness={1} />
      </mesh>

      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[width, length, 1, 1]} />
        <primitive object={waterMaterial} attach="material" />
      </mesh>

      <mesh ref={foamRef1} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[width - 0.5, length, 1, 1]} />
        <primitive object={foamMaterial} attach="material" />
      </mesh>

      {rocks.map((rock, i) => (
        <mesh
          key={i}
          position={[rock.x, -0.25 + rock.scale * 0.4, rock.z]}
          rotation={[rock.rotation * 0.3, rock.rotation, rock.rotation * 0.5]}
          castShadow
        >
          <dodecahedronGeometry args={[rock.scale, 0]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} />
        </mesh>
      ))}

      {Array.from({ length: 6 }).map((_, i) => {
        const z = -length / 2 + 4 + (i / 5) * (length - 8)
        return (
          <group key={`bank-${i}`}>
            <mesh position={[-width / 2 - 0.8, -0.05, z]} rotation={[0, 0, 0.1]}>
              <boxGeometry args={[0.6, 0.5, 1.5]} />
              <meshStandardMaterial color="#6D4C41" roughness={1} />
            </mesh>
            <mesh position={[width / 2 + 0.8, -0.05, z]} rotation={[0, 0, -0.1]}>
              <boxGeometry args={[0.6, 0.5, 1.5]} />
              <meshStandardMaterial color="#6D4C41" roughness={1} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
