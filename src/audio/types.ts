export interface AudioFrame {
  time: number
  duration: number
  amplitude: number
  frequencyBins: Float32Array
  bass: number
  mid: number
  treble: number
  transient: boolean
  bpm: number
}

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  fileName: string | null
}
