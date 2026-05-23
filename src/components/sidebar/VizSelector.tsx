import { VIZ_REGISTRY, type VizName } from '../../visualizers/index'

interface Props {
  activeList: VizName[]
  onToggle: (v: VizName) => void
}

const ICONS: Record<VizName, React.ReactNode> = {
  spectrum: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <rect x="2" y="10" width="3" height="12" rx="1"/><rect x="7" y="6" width="3" height="16" rx="1"/>
      <rect x="12" y="3" width="3" height="19" rx="1"/><rect x="17" y="7" width="3" height="15" rx="1"/>
    </svg>
  ),
  waveform: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M2 12 Q5 4 8 12 Q11 20 14 12 Q17 4 20 12 Q21.5 16 22 12"/>
    </svg>
  ),
  circular: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  particles: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <circle cx="12" cy="12" r="2"/><circle cx="5" cy="7" r="1.5"/><circle cx="19" cy="7" r="1.5"/>
      <circle cx="5" cy="17" r="1.5"/><circle cx="19" cy="17" r="1.5"/><circle cx="12" cy="3" r="1.5"/>
      <circle cx="12" cy="21" r="1.5"/>
    </svg>
  ),
}

export function VizSelector({ activeList, onToggle }: Props) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Visualizers</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(VIZ_REGISTRY) as VizName[]).map((key) => {
          const isActive = activeList.includes(key)
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors text-xs font-medium
                ${isActive
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'}`}
            >
              {isActive && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
              {ICONS[key]}
              {VIZ_REGISTRY[key].label}
            </button>
          )
        })}
      </div>
      {activeList.length > 1 && (
        <p className="text-zinc-600 text-xs mt-2">{activeList.length} active</p>
      )}
    </div>
  )
}
