import { useCallback, useEffect, useRef } from 'react'
import type { AudioEngine } from '../../audio/AudioEngine'
import { useAppStore } from '../../store/appStore'

interface Props {
  engine: AudioEngine
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function PlaybackBar({ engine }: Props) {
  const { isPlaying, currentTime, duration, setPlaying, setCurrentTime } = useAppStore()
  const rafRef = useRef<number | null>(null)

  // Sync currentTime from AudioEngine into store each frame
  useEffect(() => {
    const tick = () => {
      setCurrentTime(engine.currentTime)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [engine, setCurrentTime])

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      engine.pause()
      setPlaying(false)
    } else {
      await engine.play()
      setPlaying(true)
    }
  }, [engine, isPlaying, setPlaying])

  const onSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    engine.seek(t)
    setCurrentTime(t)
  }, [engine, setCurrentTime])

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900 border-t border-zinc-800">
      <button
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-400 text-black transition-colors flex-shrink-0"
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <span className="text-zinc-400 text-xs tabular-nums w-10 flex-shrink-0">{formatTime(currentTime)}</span>

      <div className="relative flex-1 h-1.5 bg-zinc-700 rounded-full">
        <div className="absolute inset-y-0 left-0 bg-cyan-500 rounded-full" style={{ width: `${progress * 100}%` }} />
        <input
          type="range" min={0} max={duration || 0} step={0.01} value={currentTime}
          onChange={onSeek}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>

      <span className="text-zinc-400 text-xs tabular-nums w-10 flex-shrink-0 text-right">{formatTime(duration)}</span>
    </div>
  )
}
