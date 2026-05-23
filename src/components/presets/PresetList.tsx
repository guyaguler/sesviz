import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { SavePresetModal } from './SavePresetModal'

export function PresetList() {
  const { presets, loadPreset, deletePreset } = useAppStore()
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Presets</p>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
        >
          + Save
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="text-xs text-zinc-600 italic">No presets yet. Configure the visualizer and save one.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {presets.map((preset) => (
            <li
              key={preset.id}
              className="flex items-center justify-between group px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
            >
              <button
                onClick={() => loadPreset(preset.id)}
                className="text-sm text-zinc-300 hover:text-white transition-colors truncate text-left flex-1"
              >
                {preset.name}
              </button>
              <button
                onClick={() => deletePreset(preset.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors ml-2 opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="Delete preset"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showModal && <SavePresetModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
