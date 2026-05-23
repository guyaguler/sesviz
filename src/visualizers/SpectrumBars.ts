import * as THREE from 'three'
import type { AudioFrame } from '../audio/types'
import { BaseVisualizer, type VisualizerParams } from './BaseVisualizer'

const BAR_COUNT = 128
const BAR_WIDTH = 0.06
const BAR_GAP = 0.02
const MAX_HEIGHT = 11   // tall enough to reach top of screen (visible Y ≈ ±5.77 with current camera)
// Bottom of bars sits just above the lower edge of the visible area
const FLOOR_Y = -5.5

export class SpectrumBars extends BaseVisualizer {
  private mesh: THREE.InstancedMesh | null = null
  private dummy = new THREE.Object3D()
  private primaryColor  = new THREE.Color()
  private secondaryColor = new THREE.Color()
  private barColor = new THREE.Color()

  init(scene: THREE.Scene): void {
    const geo = new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_WIDTH)
    const mat = new THREE.MeshBasicMaterial()
    this.mesh = new THREE.InstancedMesh(geo, mat, BAR_COUNT)
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    scene.add(this.mesh)
  }

  update(frame: AudioFrame, params: VisualizerParams): void {
    if (!this.mesh) return
    const { frequencyBins, bass } = frame
    const step = BAR_WIDTH + BAR_GAP
    const totalWidth = BAR_COUNT * step

    this.primaryColor.set(params.primaryColor)
    this.secondaryColor.set(params.secondaryColor)

    for (let i = 0; i < BAR_COUNT; i++) {
      const binIndex = Math.floor((i / BAR_COUNT) * frequencyBins.length)
      const value = (frequencyBins[binIndex] ?? 0) * params.sensitivity
      const height = Math.max(0.02, value * MAX_HEIGHT)
      const x = i * step - totalWidth / 2

      // Bottom of each bar is pinned to FLOOR_Y
      this.dummy.position.set(x, FLOOR_Y + height / 2, 0)
      this.dummy.scale.set(1, height, 1)
      this.dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this.dummy.matrix)

      const t = Math.min(value + bass * 0.3, 1)
      this.barColor.copy(this.primaryColor).lerp(this.secondaryColor, t)
      this.mesh.setColorAt(i, this.barColor)
    }

    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  dispose(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh)
      this.mesh.geometry.dispose()
      ;(this.mesh.material as THREE.Material).dispose()
      this.mesh = null
    }
  }
}
