import * as THREE from 'three'
import type { AudioAnalyser } from '../audio/AudioAnalyser'
import type { BaseVisualizer, VisualizerParams } from '../visualizers/BaseVisualizer'
import type { VizName } from '../visualizers/index'
import { VIZ_REGISTRY } from '../visualizers/index'
import { TextOverlay } from './TextOverlay'

export class Renderer {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private rafId: number | null = null
  private visualizers = new Map<VizName, BaseVisualizer>()
  private analyser: AudioAnalyser | null = null
  private textOverlay: TextOverlay | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a0a)

    // Straight-on camera — visible Y at z=0 is ±tan(30°)×10 ≈ ±5.77
    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, 10)
    this.camera.lookAt(0, 0, 0)

    this.resize(canvas.clientWidth, canvas.clientHeight)
  }

  setAnalyser(analyser: AudioAnalyser): void {
    this.analyser = analyser
  }

  // Diffs old vs new list — disposes removed, inits added, preserves unchanged
  setVisualizers(names: VizName[]): void {
    const incoming = new Set(names)

    // Remove visualizers no longer in the list
    for (const [name, viz] of this.visualizers) {
      if (!incoming.has(name)) {
        viz.dispose(this.scene)
        this.visualizers.delete(name)
      }
    }

    // Add new visualizers
    for (const name of names) {
      if (!this.visualizers.has(name)) {
        const viz = VIZ_REGISTRY[name].create()
        viz.init(this.scene)
        this.visualizers.set(name, viz)
      }
    }
  }

  start(getParams: () => VisualizerParams): void {
    const loop = () => {
      this.rafId = requestAnimationFrame(loop)
      if (this.analyser && this.visualizers.size > 0) {
        const frame = this.analyser.extract()
        const params = getParams()
        for (const viz of this.visualizers.values()) {
          viz.update(frame, params)
        }
      }
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  setOverlayText(text: string): void {
    if (!text.trim()) {
      if (this.textOverlay) {
        this.textOverlay.dispose(this.scene)
        this.textOverlay = null
      }
      return
    }
    if (!this.textOverlay) {
      this.textOverlay = new TextOverlay()
      this.textOverlay.init(this.scene)
    }
    this.textOverlay.setText(text)
  }

  dispose(): void {
    this.stop()
    for (const viz of this.visualizers.values()) viz.dispose(this.scene)
    this.visualizers.clear()
    this.textOverlay?.dispose(this.scene)
    this.renderer.dispose()
  }
}
