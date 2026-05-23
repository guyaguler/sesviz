import type { AudioEngine } from './AudioEngine'
import type { AudioFrame } from './types'

const FFT_SIZE = 2048
const SAMPLE_RATE = 44100

// Frequency bin index helpers
function hzToIndex(hz: number, sampleRate: number, fftSize: number): number {
  return Math.round((hz / (sampleRate / 2)) * (fftSize / 2))
}

const BASS_LO = 20
const BASS_HI = 250
const MID_LO = 250
const MID_HI = 4000
const TREBLE_LO = 4000
const TREBLE_HI = 20000

function bandAverage(bins: Uint8Array, lo: number, hi: number, sampleRate: number, fftSize: number): number {
  const start = hzToIndex(lo, sampleRate, fftSize)
  const end = hzToIndex(hi, sampleRate, fftSize)
  let sum = 0
  for (let i = start; i <= end; i++) sum += bins[i]!
  return sum / ((end - start + 1) * 255)
}

export class AudioAnalyser {
  private freqData: Uint8Array
  private timeData: Uint8Array
  private freqFloat: Float32Array
  private prevAmplitude = 0
  private bpm = 120

  constructor(private engine: AudioEngine) {
    this.freqData = new Uint8Array(FFT_SIZE / 2)
    this.timeData = new Uint8Array(FFT_SIZE)
    this.freqFloat = new Float32Array(FFT_SIZE / 2)
  }

  updateBpm(bpm: number): void {
    this.bpm = bpm
  }

  extract(): AudioFrame {
    const { analyser, currentTime, duration } = this.engine
    const sampleRate = this.engine.context.sampleRate || SAMPLE_RATE

    analyser.getByteFrequencyData(this.freqData)
    analyser.getByteTimeDomainData(this.timeData)

    // RMS amplitude from time-domain data
    let rms = 0
    for (let i = 0; i < this.timeData.length; i++) {
      const sample = (this.timeData[i]! - 128) / 128
      rms += sample * sample
    }
    const amplitude = Math.sqrt(rms / this.timeData.length)

    // Frequency bands
    const bass = bandAverage(this.freqData, BASS_LO, BASS_HI, sampleRate, FFT_SIZE)
    const mid = bandAverage(this.freqData, MID_LO, MID_HI, sampleRate, FFT_SIZE)
    const treble = bandAverage(this.freqData, TREBLE_LO, TREBLE_HI, sampleRate, FFT_SIZE)

    // Transient detection: sharp amplitude increase above threshold
    const delta = amplitude - this.prevAmplitude
    const transient = delta > 0.08 && amplitude > 0.15
    this.prevAmplitude = amplitude

    // Normalize freq bins to 0–1 Float32Array for visualizers
    for (let i = 0; i < this.freqData.length; i++) {
      this.freqFloat[i] = this.freqData[i]! / 255
    }

    return {
      time: currentTime,
      duration,
      amplitude,
      frequencyBins: this.freqFloat,
      bass,
      mid,
      treble,
      transient,
      bpm: this.bpm,
    }
  }
}
