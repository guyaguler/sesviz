import type * as THREE from 'three'
import type { AudioFrame } from '../audio/types'

export interface VisualizerParams {
  primaryColor: string
  secondaryColor: string
  sensitivity: number
}

export abstract class BaseVisualizer {
  abstract init(scene: THREE.Scene): void
  abstract update(frame: AudioFrame, params: VisualizerParams): void
  abstract dispose(scene: THREE.Scene): void
}
