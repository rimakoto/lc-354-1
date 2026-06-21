import { create } from 'zustand'

interface SceneState {
  waterSpeed: number
  wheelRotation: number
  millstoneRotation: number
  setWaterSpeed: (speed: number) => void
  setWheelRotation: (rotation: number) => void
  setMillstoneRotation: (rotation: number) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  waterSpeed: 0.5,
  wheelRotation: 0,
  millstoneRotation: 0,
  setWaterSpeed: (speed) => set({ waterSpeed: speed }),
  setWheelRotation: (rotation) => set({ wheelRotation: rotation }),
  setMillstoneRotation: (rotation) => set({ millstoneRotation: rotation }),
}))
