import { useCallback, useEffect, useRef, useState } from 'react'
import { startExport, triggerDownload, type ExportSession, type ExportOptions } from '../../export/ExportEngine'
import type { AudioEngine } from '../../audio/AudioEngine'
import type { VisualizerCanvasHandle } from '../canvas/VisualizerCanvas'
import { useAppStore } from '../../store/appStore'
import type { RefObject } from 'react'

type Phase = 'idle' | 'recording' | 'done'

interface Props {
  engine: AudioEngine
  vizRef: RefObject<VisualizerCanvasHandle | null>
  onClose: () => void
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function ExportDialog({ engine, vizRef, onClose }: Props) {
  const { fileName, duration } = useAppStore()
  const [fps, setFps] = useState<ExportOptions['fps']>(60)
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const sessionRef = useRef<ExportSession | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const rafRef = useRef<number | null>(null)

  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0

  const startRecording = useCallback(async () => {
    const canvas = vizRef.current?.getCanvas()
    if (!canvas) return

    engine.seek(0)

    // Create streams and start the recorder BEFORE playing audio.
    // canvas.captureStream has 1-2 frames of pipeline latency that the audio
    // stream does not, so we let the recorder warm up first, then play audio.
    const audioStream = engine.createAudioExportStream()
    const session = startExport(canvas, audioStream, { fps })
    sessionRef.current = session
    setPhase('recording')
    setElapsed(0)

    // Wait 2 rAF frames so captureStream delivers its first frames and the
    // recorder's internal muxer initialises before audio begins.
    await new Promise<void>(resolve => {
      let count = 0
      const wait = () => { if (++count >= 2) resolve(); else requestAnimationFrame(wait) }
      requestAnimationFrame(wait)
    })

    await engine.play()
    useAppStore.getState().setPlaying(true)

    // Poll elapsed from engine.currentTime
    const tick = () => {
      const t = engine.currentTime
      setElapsed(t)
      if (t < engine.duration && engine.isPlaying) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        finishRecording()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [engine, vizRef, fps]) // eslint-disable-line react-hooks/exhaustive-deps

  const finishRecording = useCallback(async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    engine.pause()
    useAppStore.getState().setPlaying(false)
    const blob = await sessionRef.current?.stop()
    if (blob) blobRef.current = blob
    setPhase('done')
  }, [engine])

  const handleCancel = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    sessionRef.current?.stop()
    engine.pause()
    useAppStore.getState().setPlaying(false)
    onClose()
  }, [engine, onClose])

  const handleDownload = useCallback(() => {
    const blob = blobRef.current
    const session = sessionRef.current
    if (!blob || !session || !fileName) return
    triggerDownload(blob, session.mimeType, fileName)
    onClose()
  }, [fileName, onClose])

  // Stop recording if user closes with Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-96 shadow-2xl">
        <h2 className="text-sm font-semibold text-white mb-1">Export Video</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Records in real-time — playback runs from the start until the track ends.
        </p>

        {/* FPS selector — only before recording */}
        {phase === 'idle' && (
          <div className="mb-5">
            <p className="text-xs text-zinc-500 mb-2">Frame rate</p>
            <div className="flex gap-2">
              {([30, 60] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${fps === f ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {phase === 'recording' && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Recording…</span>
              <span>{formatTime(elapsed)} / {formatTime(duration)}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="mb-5 flex items-center gap-2 text-green-400 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Recording complete
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {phase === 'done' ? 'Close' : 'Cancel'}
          </button>

          {phase === 'idle' && (
            <button
              onClick={startRecording}
              className="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors"
            >
              Start recording
            </button>
          )}

          {phase === 'done' && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
