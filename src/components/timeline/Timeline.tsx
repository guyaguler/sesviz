import { useCallback, useRef } from 'react'
import { useAppStore } from '../../store/appStore'
import { TRACK_NAMES, TRACK_LABELS, type TrackName } from '../../keyframing/types'
import { keyframeValueToColor } from '../../keyframing/KeyframeInterpolator'

const LANE_HEIGHT = 32
const HEADER_W = 110

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

interface LaneProps {
  name: TrackName
  duration: number
  currentTime: number
}

function ParameterLane({ name, duration, currentTime }: LaneProps) {
  const { keyframeTracks, addKeyframe, removeKeyframe } = useAppStore()
  const trackRef = useRef<HTMLDivElement>(null)
  const keyframes = keyframeTracks[name]

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration === 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const t = parseFloat((ratio * duration).toFixed(2))
    // If clicking near an existing keyframe, remove it instead
    const hit = keyframes.find(k => Math.abs(k.time - t) < duration * 0.015)
    if (hit) removeKeyframe(name, hit.time)
    else addKeyframe(name, currentTime)
  }, [duration, keyframes, name, addKeyframe, removeKeyframe, currentTime])

  const isColor = name !== 'sensitivity'
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center" style={{ height: LANE_HEIGHT }}>
      <div className="flex-shrink-0 text-xs text-zinc-500 pr-2 text-right" style={{ width: HEADER_W }}>
        {TRACK_LABELS[name]}
      </div>
      <div
        ref={trackRef}
        onClick={handleClick}
        className="relative flex-1 h-5 bg-zinc-800 rounded cursor-crosshair select-none"
        title="Click to add keyframe at playhead • Click existing keyframe to remove"
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px bg-cyan-400/60 pointer-events-none"
          style={{ left: `${playheadPct}%` }}
        />

        {/* Keyframe diamonds */}
        {keyframes.map((kf) => {
          const pct = duration > 0 ? (kf.time / duration) * 100 : 0
          const color = isColor ? keyframeValueToColor(kf.value) : null
          return (
            <div
              key={kf.time}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border border-white/40 cursor-pointer hover:scale-125 transition-transform"
              style={{
                left: `${pct}%`,
                background: color ?? '#00d4ff',
              }}
              title={`t=${kf.time.toFixed(2)}s — click to remove`}
              onClick={(e) => { e.stopPropagation(); removeKeyframe(name, kf.time) }}
            />
          )
        })}
      </div>
    </div>
  )
}

interface Props {
  duration: number
  currentTime: number
}

export function Timeline({ duration, currentTime }: Props) {
  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2 flex-shrink-0">
      <div className="flex items-center mb-1" style={{ paddingLeft: HEADER_W }}>
        <p className="text-xs text-zinc-600 select-none">Timeline — click lane to add keyframe at playhead</p>
      </div>
      <div className="flex flex-col gap-1">
        {TRACK_NAMES.map((name) => (
          <ParameterLane key={name} name={name} duration={duration} currentTime={currentTime} />
        ))}
      </div>
    </div>
  )
}
