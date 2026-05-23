const SUPPORTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/aiff', 'audio/x-aiff', 'audio/flac', 'audio/x-flac', 'audio/mp4', 'audio/x-m4a']

// Safari uses the webkit-prefixed constructor
const AudioContextCtor: typeof AudioContext =
  (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)

export class AudioEngine {
  readonly context: AudioContext
  private source: AudioBufferSourceNode | null = null
  private buffer: AudioBuffer | null = null
  readonly analyser: AnalyserNode
  private gain: GainNode
  private startTime = 0
  private startOffset = 0
  private _isPlaying = false

  constructor() {
    this.context = new AudioContextCtor()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.8
    this.gain = this.context.createGain()
    this.analyser.connect(this.gain)
    this.gain.connect(this.context.destination)
  }

  get isPlaying() { return this._isPlaying }

  get currentTime(): number {
    if (!this.buffer) return 0
    if (!this._isPlaying) return this.startOffset
    return Math.min(this.startOffset + (this.context.currentTime - this.startTime), this.buffer.duration)
  }

  get duration(): number {
    return this.buffer?.duration ?? 0
  }

  static isSupported(file: File): boolean {
    return SUPPORTED_TYPES.includes(file.type) || /\.(mp3|wav|aif|aiff|flac|m4a)$/i.test(file.name)
  }

  async load(file: File): Promise<void> {
    this.stop()
    const arrayBuffer = await file.arrayBuffer()
    this.buffer = await this.context.decodeAudioData(arrayBuffer)
    this.startOffset = 0
  }

  async play(): Promise<void> {
    if (!this.buffer || this._isPlaying) return
    // If playhead is at the end, reset to beginning
    if (this.startOffset >= this.buffer.duration) this.startOffset = 0
    await this.context.resume()
    this.source = this.context.createBufferSource()
    this.source.buffer = this.buffer
    this.source.connect(this.analyser)
    this.source.onended = () => {
      if (this._isPlaying) this._isPlaying = false
    }
    this.startTime = this.context.currentTime
    this.source.start(0, this.startOffset)
    this._isPlaying = true
  }

  pause(): void {
    if (!this._isPlaying) return
    this.startOffset = this.currentTime
    this.source?.stop()
    this.source = null
    this._isPlaying = false
  }

  stop(): void {
    this.source?.stop()
    this.source = null
    this._isPlaying = false
    this.startOffset = 0
  }

  seek(time: number): void {
    const wasPlaying = this._isPlaying
    if (wasPlaying) {
      this.source?.stop()
      this.source = null
      this._isPlaying = false
    }
    this.startOffset = Math.max(0, Math.min(time, this.duration))
    if (wasPlaying) this.play()
  }

  // Returns a MediaStream of the audio output — used by ExportEngine to capture audio
  createAudioExportStream(): MediaStream {
    const dest = this.context.createMediaStreamDestination()
    this.gain.connect(dest)
    return dest.stream
  }

  dispose(): void {
    this.stop()
    this.context.close()
  }
}
