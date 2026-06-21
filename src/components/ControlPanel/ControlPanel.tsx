import { useState } from 'react'
import { Droplets, RotateCcw, Info } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

interface ControlPanelProps {
  controlsRef: React.RefObject<OrbitControlsImpl | null>
}

export function ControlPanel({ controlsRef }: ControlPanelProps) {
  const { waterSpeed, setWaterSpeed } = useSceneStore()
  const [showInfo, setShowInfo] = useState(false)

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWaterSpeed(parseFloat(e.target.value))
  }

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  const speedLabel = waterSpeed < 0.3 ? '缓慢' : waterSpeed < 0.7 ? '适中' : '湍急'

  return (
    <>
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-white/50">
          <h1 className="text-2xl font-bold text-stone-800 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            乡间水车磨坊
          </h1>
          <p className="text-sm text-stone-600">
            拖动旋转 · 滚轮缩放 · 探索细节
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/60 w-72">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-800">水流速度</h2>
              <p className="text-xs text-stone-500">调节水流控制水车转速</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-stone-600">速度</span>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {speedLabel}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={waterSpeed}
              onChange={handleSpeedChange}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #60A5FA 0%, #3B82F6 ${waterSpeed * 100}%, #E7E5E4 ${waterSpeed * 100}%, #E7E5E4 100%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-stone-400">缓慢</span>
              <span className="text-xs text-stone-400">湍急</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResetView}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              重置视角
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors text-sm font-medium"
            >
              <Info className="w-4 h-4" />
              说明
            </button>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/60 max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-stone-800">关于水车磨坊</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-stone-400 hover:text-stone-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-3 text-stone-600 text-sm">
              <p>
                <span className="font-semibold text-stone-700">工作原理：</span>
                水流冲击水车轮叶，推动水车旋转，通过传动装置带动磨坊内的石磨转动，用于研磨谷物。
              </p>
              <p>
                <span className="font-semibold text-stone-700">操作方式：</span>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>鼠标拖拽：旋转视角</li>
                <li>鼠标滚轮：缩放画面</li>
                <li>右键拖拽：平移视角</li>
                <li>调节滑块：改变水流速度</li>
              </ul>
              <p className="text-stone-500 text-xs mt-4">
                提示：将镜头拉近，可以观察水花溅到叶片上的细节效果
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md border border-white/50">
          <p className="text-xs text-stone-500">
            🖱️ 拖拽旋转 · 🔍 滚轮缩放
          </p>
        </div>
      </div>
    </>
  )
}
