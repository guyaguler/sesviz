import * as THREE from 'three'
import type { KeyframeTracks } from './types'
import type { VisualizerParams } from '../visualizers/BaseVisualizer'

// Module-level cached Color objects — never allocated per frame
const _ca = new THREE.Color()
const _cb = new THREE.Color()

function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

function intToHex(n: number): string {
  return '#' + Math.round(n).toString(16).padStart(6, '0')
}

function lerpColor(a: number, b: number, t: number): number {
  _ca.set(a)
  _cb.set(b)
  _ca.lerp(_cb, t)
  return (Math.round(_ca.r * 255) << 16) | (Math.round(_ca.g * 255) << 8) | Math.round(_ca.b * 255)
}

function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function resolveTrack(
  track: { time: number; value: number }[],
  time: number,
  isColor: boolean,
  baseValue: string | number,
): string | number {
  if (track.length < 2) return baseValue
  if (time <= track[0]!.time) return baseValue
  const last = track[track.length - 1]!
  if (time >= last.time) return isColor ? intToHex(last.value) : last.value

  let lo = 0, hi = track.length - 1
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1
    if (track[mid]!.time <= time) lo = mid
    else hi = mid
  }
  const kA = track[lo]!
  const kB = track[hi]!
  const alpha = (time - kA.time) / (kB.time - kA.time)
  return isColor ? intToHex(lerpColor(kA.value, kB.value, alpha)) : lerpNumber(kA.value, kB.value, alpha)
}

export function resolveParams(
  tracks: KeyframeTracks,
  time: number,
  base: VisualizerParams,
): VisualizerParams {
  // Fast path: if no track has keyframes skip all interpolation
  if (
    tracks.primaryColor.length < 2 &&
    tracks.secondaryColor.length < 2 &&
    tracks.sensitivity.length < 2
  ) return base

  return {
    primaryColor:   resolveTrack(tracks.primaryColor,   time, true,  base.primaryColor)   as string,
    secondaryColor: resolveTrack(tracks.secondaryColor, time, true,  base.secondaryColor) as string,
    sensitivity:    resolveTrack(tracks.sensitivity,    time, false, base.sensitivity)    as number,
  }
}

export function colorToKeyframeValue(hex: string): number {
  return hexToInt(hex)
}

export function keyframeValueToColor(v: number): string {
  return intToHex(v)
}
