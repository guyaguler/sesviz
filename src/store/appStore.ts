import { create } from 'zustand'
import type { VizName } from '../visualizers/index'
import type { KeyframeTracks, TrackName } from '../keyframing/types'
import { emptyTracks } from '../keyframing/types'
import { colorToKeyframeValue } from '../keyframing/KeyframeInterpolator'

export interface Preset {
  id: string
  name: string
  activeVizList: VizName[]
  primaryColor: string
  secondaryColor: string
  sensitivity: number
  keyframeTracks: KeyframeTracks
}

interface AppState {
  fileName: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  primaryColor: string
  secondaryColor: string
  sensitivity: number
  activeVizList: VizName[]
  overlayText: string
  keyframeTracks: KeyframeTracks
  presets: Preset[]

  setFile: (name: string, duration: number) => void
  setPlaying: (playing: boolean) => void
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setPrimaryColor: (c: string) => void
  setSecondaryColor: (c: string) => void
  setSensitivity: (s: number) => void
  toggleViz: (v: VizName) => void
  setOverlayText: (t: string) => void

  addKeyframe: (track: TrackName, time: number) => void
  removeKeyframe: (track: TrackName, time: number) => void
  clearTrack: (track: TrackName) => void

  savePreset: (name: string) => void
  loadPreset: (id: string) => void
  deletePreset: (id: string) => void
}

function insertSorted(keyframes: { time: number; value: number }[], kf: { time: number; value: number }) {
  const idx = keyframes.findIndex(k => k.time === kf.time)
  if (idx !== -1) {
    const copy = [...keyframes]
    copy[idx] = kf
    return copy
  }
  return [...keyframes, kf].sort((a, b) => a.time - b.time)
}

function loadPresets(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem('sesviz-presets') ?? '[]')
  } catch {
    return []
  }
}

function savePresets(presets: Preset[]): void {
  localStorage.setItem('sesviz-presets', JSON.stringify(presets))
}

export const useAppStore = create<AppState>((set) => ({
  fileName: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  primaryColor: '#00d4ff',
  secondaryColor: '#ff006e',
  sensitivity: 1.5,
  activeVizList: ['spectrum'],
  overlayText: '',
  keyframeTracks: emptyTracks(),
  presets: loadPresets(),

  setFile: (name, duration) => set({ fileName: name, duration, currentTime: 0, isPlaying: false, keyframeTracks: emptyTracks() }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setSecondaryColor: (secondaryColor) => set({ secondaryColor }),
  setSensitivity: (sensitivity) => set({ sensitivity }),

  setOverlayText: (overlayText) => set({ overlayText }),

  toggleViz: (v) => set((s) => {
    const has = s.activeVizList.includes(v)
    // Always keep at least one visualizer active
    if (has && s.activeVizList.length === 1) return {}
    return {
      activeVizList: has
        ? s.activeVizList.filter(x => x !== v)
        : [...s.activeVizList, v],
    }
  }),

  addKeyframe: (track, time) => set((s) => {
    const value = track === 'sensitivity'
      ? s.sensitivity
      : colorToKeyframeValue(track === 'primaryColor' ? s.primaryColor : s.secondaryColor)
    return {
      keyframeTracks: {
        ...s.keyframeTracks,
        [track]: insertSorted(s.keyframeTracks[track], { time, value }),
      },
    }
  }),

  removeKeyframe: (track, time) => set((s) => ({
    keyframeTracks: {
      ...s.keyframeTracks,
      [track]: s.keyframeTracks[track].filter(k => k.time !== time),
    },
  })),

  clearTrack: (track) => set((s) => ({
    keyframeTracks: { ...s.keyframeTracks, [track]: [] },
  })),

  savePreset: (name) => set((s) => {
    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      activeVizList: s.activeVizList,
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
      sensitivity: s.sensitivity,
      keyframeTracks: s.keyframeTracks,
    }
    const presets = [...s.presets, preset]
    savePresets(presets)
    return { presets }
  }),

  loadPreset: (id) => set((s) => {
    const preset = s.presets.find(p => p.id === id)
    if (!preset) return {}
    return {
      activeVizList: preset.activeVizList ?? ['spectrum'],
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      sensitivity: preset.sensitivity,
      keyframeTracks: preset.keyframeTracks,
    }
  }),

  deletePreset: (id) => set((s) => {
    const presets = s.presets.filter(p => p.id !== id)
    savePresets(presets)
    return { presets }
  }),
}))
