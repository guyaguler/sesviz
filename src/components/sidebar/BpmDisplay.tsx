interface Props {
  bpm: number
}

export function BpmDisplay({ bpm }: Props) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">BPM</p>
      <span className="text-2xl font-bold tabular-nums text-cyan-400">{Math.round(bpm)}</span>
    </div>
  )
}
