import { useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Scene } from '@/components/Scene/Scene'
import { ControlPanel } from '@/components/ControlPanel/ControlPanel'

export default function Home() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <Scene controlsRef={controlsRef} />
      <ControlPanel controlsRef={controlsRef} />
    </div>
  )
}
