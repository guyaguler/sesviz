import { SpectrumBars } from './SpectrumBars'
import { Waveform } from './Waveform'
import { CircularViz } from './CircularViz'
import { ParticleSystem } from './ParticleSystem'
import type { BaseVisualizer } from './BaseVisualizer'

export type VizName = 'spectrum' | 'waveform' | 'circular' | 'particles'

export const VIZ_REGISTRY: Record<VizName, { label: string; create: () => BaseVisualizer }> = {
  spectrum:  { label: 'Spectrum',  create: () => new SpectrumBars() },
  waveform:  { label: 'Waveform',  create: () => new Waveform() },
  circular:  { label: 'Circular',  create: () => new CircularViz() },
  particles: { label: 'Particles', create: () => new ParticleSystem() },
}
