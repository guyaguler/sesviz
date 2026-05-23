import * as THREE from 'three'

const TEX_W = 2048
const TEX_H = 1152  // 16:9

// Plane fills the full visible screen at z=1 (camera at z=10, FOV 60, dist=9)
// Visible height: 2*tan(30°)*9 ≈ 10.39  width: ×(16/9) ≈ 18.5
const PLANE_W = 18.5
const PLANE_H = 10.4

const FONT_PRIMARY   = 'bold 96px "Playfair Display", Georgia, serif'
const FONT_SECONDARY = '400 72px "Playfair Display", Georgia, serif'
const LINE_SPACING   = 100   // px between secondary lines
const FIRST_TO_SECOND_GAP = 110  // px from first-line baseline to second-line baseline

export class TextOverlay {
  private offscreen: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private texture: THREE.CanvasTexture | null = null
  private plane: THREE.Mesh | null = null
  private currentText = ''

  constructor() {
    this.offscreen = document.createElement('canvas')
    this.offscreen.width  = TEX_W
    this.offscreen.height = TEX_H
    this.ctx = this.offscreen.getContext('2d')!
  }

  init(scene: THREE.Scene): void {
    this.texture = new THREE.CanvasTexture(this.offscreen)
    // Default flipY = true: canvas y=0 (top) → UV y=1 → top of plane → top of screen ✓

    const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H)
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,  // front face faces +Z = toward camera at z=10
    })

    this.plane = new THREE.Mesh(geo, mat)
    this.plane.position.set(0, 0, 1)
    scene.add(this.plane)
  }

  setText(text: string): void {
    if (text === this.currentText) return
    this.currentText = text
    this.render()
  }

  private async render(): Promise<void> {
    try { await document.fonts.load(FONT_PRIMARY) } catch { /* fallback to serif */ }

    const ctx = this.ctx
    const cx  = TEX_W / 2
    const cy  = TEX_H / 2

    ctx.clearRect(0, 0, TEX_W, TEX_H)

    const lines = this.currentText.split('\n').map(l => l.trim())
    const nonEmpty = lines.filter(l => l !== '')
    if (nonEmpty.length === 0) {
      if (this.texture) this.texture.needsUpdate = true
      return
    }

    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor  = 'rgba(0,0,0,0.9)'
    ctx.shadowBlur   = 20
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 3

    // First line — bold, at canvas center → renders at screen center
    ctx.font      = FONT_PRIMARY
    ctx.fillStyle = '#ffffff'
    ctx.fillText(nonEmpty[0]!, cx, cy)

    // Remaining lines — below first line (larger canvas y = lower on screen with flipY=true)
    if (nonEmpty.length > 1) {
      ctx.font      = FONT_SECONDARY
      ctx.fillStyle = 'rgba(255,255,255,0.88)'
      for (let i = 1; i < nonEmpty.length; i++) {
        const y = cy + FIRST_TO_SECOND_GAP + (i - 1) * LINE_SPACING
        ctx.fillText(nonEmpty[i]!, cx, y)
      }
    }

    if (this.texture) this.texture.needsUpdate = true
  }

  dispose(scene: THREE.Scene): void {
    if (this.plane) {
      scene.remove(this.plane)
      this.plane.geometry.dispose()
      ;(this.plane.material as THREE.Material).dispose()
      this.plane = null
    }
    this.texture?.dispose()
    this.texture = null
  }
}
