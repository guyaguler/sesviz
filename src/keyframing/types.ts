export interface Keyframe {
  time: number
  value: number  // all animatable params are normalised to numbers (colors as 0xRRGGBB int)
}

// One track per animatable parameter
export type TrackName = 'primaryColor' | 'secondaryColor' | 'sensitivity'

export type KeyframeTracks = Record<TrackName, Keyframe[]>

export const TRACK_LABELS: Record<TrackName, string> = {
  primaryColor:   'Primary Color',
  secondaryColor: 'Secondary Color',
  sensitivity:    'Sensitivity',
}

export const TRACK_NAMES: TrackName[] = ['primaryColor', 'secondaryColor', 'sensitivity']

export function emptyTracks(): KeyframeTracks {
  return { primaryColor: [], secondaryColor: [], sensitivity: [] }
}
