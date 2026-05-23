import { PALETTES } from '../../utils/colorPalettes'
import { useAppStore } from '../../store/appStore'

export function ColorThemePanel() {
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useAppStore()

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Colors</p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {PALETTES.map((p) => (
          <button
            key={p.name}
            title={p.name}
            onClick={() => { setPrimaryColor(p.primary); setSecondaryColor(p.secondary) }}
            className="w-8 h-8 rounded-full border-2 border-zinc-700 hover:border-white transition-colors overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)` }}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-zinc-500">Primary</span>
          <input
            type="color" value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer bg-transparent border border-zinc-700"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-zinc-500">Secondary</span>
          <input
            type="color" value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer bg-transparent border border-zinc-700"
          />
        </label>
      </div>
    </div>
  )
}
