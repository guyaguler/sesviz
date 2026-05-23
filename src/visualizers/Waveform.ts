import * as THREE from 'three'
import type { AudioFrame } from '../audio/types'
import { BaseVisualizer, type VisualizerParams } from './BaseVisualizer'

const POINTS = 512
const WIDTH = 11  // fits within visible X range (±5.5 at 16:9 with current camera)

export class Waveform extends BaseVisualizer {
  private line: THREE.Line | null = null
  private positions: Float32Array = new Float32Array(POINTS * 3)

  init(scene: THREE.Scene): void {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    const mat = new THREE.LineBasicMaterial({ vertexColors: false })
    this.line = new THREE.Line(geo, mat)
    scene.add(this.line)
  }

  update(frame: AudioFrame, params: VisualizerParams): void {
    if (!this.line) return
    const { frequencyBins, amplitude } = frame
    const mat = this.line.material as THREE.LineBasicMaterial
    mat.color.set(params.primaryColor)

    for (let i = 0; i < POINTS; i++) {
      const binIndex = Math.floor((i / POINTS) * frequencyBins.length)
      const y = ((frequencyBins[binIndex] ?? 0) * 2 - 1) * params.sensitivity * (1 + amplitude)
      const x = (i / (POINTS - 1)) * WIDTH - WIDTH / 2
      this.positions[i * 3] = x
      this.positions[i * 3 + 1] = y
      this.positions[i * 3 + 2] = 0
    }

    const attr = this.line.geometry.getAttribute('position') as THREE.BufferAttribute
    attr.needsUpdate = true
    this.line.geometry.computeBoundingSphere()
  }

  dispose(scene: THREE.Scene): void {
    if (this.line) {
      scene.remove(this.line)
      this.line.geometry.dispose()
      ;(this.line.material as THREE.Material).dispose()
      this.line = null
    }
  }
}
