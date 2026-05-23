export interface ColorPalette {
  name: string
  primary: string
  secondary: string
}

export const PALETTES: ColorPalette[] = [
  { name: 'Neon',     primary: '#00d4ff', secondary: '#ff006e' },
  { name: 'Sunset',   primary: '#ff6b35', secondary: '#f7c948' },
  { name: 'Forest',   primary: '#00c896', secondary: '#007a4d' },
  { name: 'Violet',   primary: '#b44fff', secondary: '#ff44cc' },
  { name: 'Mono',     primary: '#ffffff', secondary: '#888888' },
]
