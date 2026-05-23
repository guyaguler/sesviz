import { useAppStore } from '../../store/appStore'

export function TextOverlayPanel() {
  const { overlayText, setOverlayText } = useAppStore()

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Text Overlay</p>
      <textarea
        value={overlayText}
        onChange={(e) => setOverlayText(e.target.value)}
        placeholder={'Line 1 — bold title\nLine 2\nLine 3'}
        rows={4}
        className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 resize-none outline-none focus:border-cyan-500 transition-colors font-mono leading-relaxed"
      />
      <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed">
        First line — bold, centered in frame.<br />
        Remaining lines appear below, smaller.
      </p>
    </div>
  )
}
