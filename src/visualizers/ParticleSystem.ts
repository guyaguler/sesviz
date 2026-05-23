import * as THREE from 'three'
import type { AudioFrame } from '../audio/types'
import { BaseVisualizer, type VisualizerParams } from './BaseVisualizer'

const MAX_PARTICLES = 8000
const LIFETIME = 2.5
// Spawn area — covers the full visible canvas (camera at z=10, FOV 60, z=0 gives ±5.77 in Y)
const SPAWN_HALF_W = 10
const SPAWN_HALF_H = 6

const vertexShader = /* glsl */`
  attribute float age;
  attribute float maxAge;
  attribute float size;
  varying float vAlpha;
  void main() {
    float life = age / maxAge;
    // Fade in quickly, hold, then fade out
    vAlpha = life < 0.1 ? life / 0.1 : 1.0 - smoothstep(0.5, 1.0, life);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (400.0 / -mvPosition.z) * (1.0 - life * 0.4);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */`
  uniform vec3 uColor;
  uniform vec3 uColorB;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    // Soft glow: bright core, dim edge
    float glow = exp(-d * 5.0);
    vec3 col = mix(uColorB, uColor, glow);
    gl_FragColor = vec4(col, vAlpha * glow * 2.0);
  }
`

interface Particle {
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  age: number; maxAge: number; size: number
  active: boolean
}

export class ParticleSystem extends BaseVisualizer {
  private points: THREE.Points | null = null
  private particles: Particle[] = []
  private positions = new Float32Array(MAX_PARTICLES * 3)
  private ages = new Float32Array(MAX_PARTICLES)
  private maxAges = new Float32Array(MAX_PARTICLES)
  private sizes = new Float32Array(MAX_PARTICLES)
  private lastTime = 0
  private nextFreeIdx = 0  // round-robin cursor for fast free slot lookup

  init(scene: THREE.Scene): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 0, maxAge: 1, size: 0, active: false })
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('age',      new THREE.BufferAttribute(this.ages,      1).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('maxAge',   new THREE.BufferAttribute(this.maxAges,   1).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('size',     new THREE.BufferAttribute(this.sizes,     1).setUsage(THREE.DynamicDrawUsage))

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor:  { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(geo, mat)
    scene.add(this.points)
  }

  private emit(count: number, frame: AudioFrame, params: VisualizerParams, burst: boolean): void {
    for (let j = 0; j < count; j++) {
      const i = this.nextFreeIdx % MAX_PARTICLES
      this.nextFreeIdx++
      const p = this.particles[i]!

      const angle = Math.random() * Math.PI * 2
      const speed = burst
        ? 3.0 + Math.random() * 9 * frame.amplitude * params.sensitivity
        : 0.6 + Math.random() * 2.5 * params.sensitivity

      p.x = (Math.random() * 2 - 1) * SPAWN_HALF_W
      p.y = (Math.random() * 2 - 1) * SPAWN_HALF_H
      p.z = (Math.random() - 0.5) * 2
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.vz = (Math.random() - 0.5) * speed * 0.3
      p.age = 0
      p.maxAge = LIFETIME * (0.5 + Math.random() * 0.8)
      p.size = burst
        ? 0.3 + Math.random() * 0.6 + frame.bass * 0.4
        : 0.1 + Math.random() * 0.25
      p.active = true
    }
  }

  update(frame: AudioFrame, params: VisualizerParams): void {
    if (!this.points) return
    const dt = this.lastTime === 0 ? 0.016 : Math.min(frame.time - this.lastTime, 0.1)
    this.lastTime = frame.time

    const mat = this.points.material as THREE.ShaderMaterial
    mat.uniforms['uColor']!.value.set(params.primaryColor)
    mat.uniforms['uColorB']!.value.set(params.secondaryColor)

    // Burst on transient
    if (frame.transient) {
      this.emit(Math.floor(120 + frame.bass * 250), frame, params, true)
    }

    // Continuous ambient emission — always visible even in quiet passages
    const ambientCount = Math.floor((frame.amplitude * params.sensitivity * 50 + 10) * dt * 60)
    if (ambientCount > 0) this.emit(ambientCount, frame, params, false)

    // Per-frame audio energy boost applied to all active particles
    const energyKick = (frame.bass * 1.5 + frame.treble * 0.5) * frame.amplitude * params.sensitivity

    // Update all particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i]!
      if (!p.active) {
        // Park inactive particles off-screen so they don't draw
        this.positions[i * 3]     = 0
        this.positions[i * 3 + 1] = -1000
        this.positions[i * 3 + 2] = 0
        this.ages[i]    = 1
        this.maxAges[i] = 1
        this.sizes[i]   = 0
        continue
      }

      p.age += dt
      if (p.age >= p.maxAge) { p.active = false; continue }

      // Audio-reactive random kick — no gravity sink, free drift
      p.vx += (energyKick * (Math.random() - 0.5) * 4 + frame.mid * 0.8 * (Math.random() - 0.5)) * dt
      p.vy += (energyKick * (Math.random() - 0.5) * 4 + frame.bass * 0.8 * (Math.random() - 0.5)) * dt
      p.vz += (-p.z * 0.03) * dt
      // Low damping — particles retain momentum much longer
      p.vx *= 0.995
      p.vy *= 0.995
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt

      this.positions[i * 3]     = p.x
      this.positions[i * 3 + 1] = p.y
      this.positions[i * 3 + 2] = p.z
      this.ages[i]    = p.age
      this.maxAges[i] = p.maxAge
      this.sizes[i]   = p.size
    }

    const geo = this.points.geometry
    ;(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute('age')      as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute('maxAge')   as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute('size')     as THREE.BufferAttribute).needsUpdate = true
  }

  dispose(scene: THREE.Scene): void {
    if (this.points) {
      scene.remove(this.points)
      this.points.geometry.dispose()
      ;(this.points.material as THREE.Material).dispose()
      this.points = null
    }
    this.particles = []
    this.lastTime = 0
    this.nextFreeIdx = 0
  }
}
