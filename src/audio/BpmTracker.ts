type MeydaLike = { createMeydaAnalyzer: (...args: unknown[]) => { start(): void; stop(): void } }

let meydaCache: MeydaLike | null = null

// Lazy-load Meyda so a load failure doesn't crash the app
async function loadMeyda(): Promise<MeydaLike | null> {
  if (meydaCache) return meydaCache
  try {
    const mod = await import('meyda')
    meydaCache = mod.default as unknown as MeydaLike
    return meydaCache
  } catch {
    return null
  }
}

export class BpmTracker {
  private analyzer: { start(): void; stop(): void } | null = null
  private bpm = 120
  private onsetsHistory: number[] = []
  private lastOnsetTime = 0
  private context: AudioContext | null = null

  get currentBpm(): number {
    return this.bpm
  }

  async start(context: AudioContext, source: AudioNode): Promise<void> {
    this.stop()
    this.context = context

    const meyda = await loadMeyda()
    if (!meyda) return  // Meyda unavailable — BPM stays at 120

    try {
      this.analyzer = meyda.createMeydaAnalyzer({
        audioContext: context,
        source,
        bufferSize: 512,
        featureExtractors: ['rms'],
        callback: (features: { rms?: number }) => {
          if (!features?.rms || !this.context) return
          const now = this.context.currentTime
          if (features.rms > 0.12 && now - this.lastOnsetTime > 0.15) {
            this.onsetsHistory.push(now)
            this.lastOnsetTime = now
            if (this.onsetsHistory.length > 16) this.onsetsHistory.shift()
            this.recalcBpm()
          }
        },
      })
      this.analyzer?.start()
    } catch {
      this.analyzer = null
    }
  }

  private recalcBpm(): void {
    const onsets = this.onsetsHistory
    if (onsets.length < 4) return
    let totalIoi = 0
    let count = 0
    for (let i = 1; i < onsets.length; i++) {
      const ioi = onsets[i]! - onsets[i - 1]!
      if (ioi >= 0.1 && ioi <= 2.0) { totalIoi += ioi; count++ }
    }
    if (count === 0) return
    let bpm = 60 / (totalIoi / count)
    while (bpm < 60) bpm *= 2
    while (bpm > 180) bpm /= 2
    this.bpm = this.bpm * 0.8 + bpm * 0.2
  }

  stop(): void {
    try { this.analyzer?.stop() } catch { /* ignore */ }
    this.analyzer = null
    this.context = null
  }
}
