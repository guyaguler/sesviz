import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import type { AudioFrame } from '../audio/types'
import { BaseVisualizer, type VisualizerParams } from './BaseVisualizer'

const SEGMENTS = 256
const BASE_RADIUS = 3.0
// Resolution used by LineMaterial for pixel-space linewidth
const RESOLUTION = new THREE.Vector2(1920, 1080)

export class CircularViz extends BaseVisualizer {
  private outerLine: Line2 | null = null
  private outerGeo: LineGeometry | null = null
  private outerMat: LineMaterial | null = null
  // Inner solid disk instead of a line ring
  private innerDisk: THREE.Mesh | null = null
  private innerDiskMat: THREE.MeshBasicMaterial | null = null
  // Inner ring outline on top of disk for extra definition
  private innerRing: Line2 | null = null
  private innerRingGeo: LineGeometry | null = null
  private innerRingMat: LineMaterial | null = null

  // Flat position arrays reused every frame — no per-frame allocation
  private outerPositions = new Float32Array((SEGMENTS + 1) * 3)
  private innerPositions = new Float32Array((SEGMENTS + 1) * 3)

  init(scene: THREE.Scene): void {
    // Outer spike ring
    this.outerGeo = new LineGeometry()
    this.outerGeo.setPositions(this.outerPositions)
    this.outerMat = new LineMaterial({ color: 0xffffff, linewidth: 3, resolution: RESOLUTION, transparent: true })
    this.outerLine = new Line2(this.outerGeo, this.outerMat)
    scene.add(this.outerLine)

    // Inner solid disk — starts small, pulses dramatically
    const diskGeo = new THREE.CircleGeometry(1, 128)
    this.innerDiskMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
    this.innerDisk = new THREE.Mesh(diskGeo, this.innerDiskMat)
    this.innerDisk.position.z = -0.05   // just behind outer ring
    scene.add(this.innerDisk)

    // Inner ring outline (drawn on top of disk)
    this.innerRingGeo = new LineGeometry()
    this.innerRingGeo.setPositions(this.innerPositions)
    this.innerRingMat = new LineMaterial({ color: 0xffffff, linewidth: 4, resolution: RESOLUTION, transparent: true })
    this.innerRing = new Line2(this.innerRingGeo, this.innerRingMat)
    scene.add(this.innerRing)
  }

  update(frame: AudioFrame, params: VisualizerParams): void {
    if (!this.outerLine || !this.innerDisk || !this.innerRing) return

    const { frequencyBins, bass, amplitude, treble } = frame

    this.outerMat!.color.set(params.primaryColor)
    this.innerDiskMat!.color.set(params.secondaryColor)
    this.innerRingMat!.color.set(params.primaryColor)

    // Outer spike ring — radius scales with bass
    const outerRadius = BASE_RADIUS + bass * 0.8

    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      const binIndex = Math.floor((i / SEGMENTS) * (frequencyBins.length / 2))
      const mag = (frequencyBins[binIndex] ?? 0) * params.sensitivity
      const spike = mag * (3 + amplitude * 3)

      const r = outerRadius + spike
      this.outerPositions[i * 3]     = Math.cos(angle) * r
      this.outerPositions[i * 3 + 1] = Math.sin(angle) * r
      this.outerPositions[i * 3 + 2] = 0
    }
    this.outerGeo!.setPositions(this.outerPositions)
    this.outerLine.computeLineDistances()

    // Inner disk — exaggerated response: larger pulse, treble adds shimmer to scale
    const innerBase = BASE_RADIUS * 0.45
    const innerPulse = bass * 1.2 + amplitude * 0.9 + treble * 0.3  // more factors, larger range
    const innerRadius = innerBase + innerPulse * params.sensitivity
    this.innerDisk.scale.setScalar(innerRadius)

    // Inner ring outline traces the disk edge
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      this.innerPositions[i * 3]     = Math.cos(angle) * innerRadius
      this.innerPositions[i * 3 + 1] = Math.sin(angle) * innerRadius
      this.innerPositions[i * 3 + 2] = 0
    }
    this.innerRingGeo!.setPositions(this.innerPositions)
    this.innerRing.computeLineDistances()
  }

  dispose(scene: THREE.Scene): void {
    if (this.outerLine) {
      scene.remove(this.outerLine)
      this.outerGeo?.dispose()
      this.outerMat?.dispose()
    }
    if (this.innerDisk) {
      scene.remove(this.innerDisk)
      this.innerDisk.geometry.dispose()
      this.innerDiskMat?.dispose()
    }
    if (this.innerRing) {
      scene.remove(this.innerRing)
      this.innerRingGeo?.dispose()
      this.innerRingMat?.dispose()
    }
    this.outerLine = null
    this.innerDisk = null
    this.innerRing = null
  }
}
