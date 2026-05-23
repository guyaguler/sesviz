import { useAppStore } from '../../store/appStore'

export function SensitivityControls() {
  const { sensitivity, setSensitivity } = useAppStore()

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Sensitivity</p>
      <div className="flex items-center gap-3">
        <input
          type="range" min={0.2} max={4} step={0.05} value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          className="flex-1 accent-cyan-500"
        />
        <span className="text-zinc-400 text-xs tabular-nums w-8 text-right">{sensitivity.toFixed(1)}×</span>
      </div>
    </div>
  )
}
