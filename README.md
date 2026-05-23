# SesViz

A web-based audio visualization app built with React 19, Three.js, and the Web Audio API. Drop in any audio file and watch it come alive in real time — then export the result as a video.

![SesViz](https://raw.githubusercontent.com/guyaguler/sesviz/main/public/screenshot.png)

## Features

- **Multiple visualizers** — run any combination simultaneously:
  - **Spectrum Bars** — frequency bars anchored to the bottom edge, color-interpolated by height
  - **Waveform** — live time-domain waveform line
  - **Circular** — thick-line ring with an audio-reactive solid fill and spiking outer edge
  - **Particles** — 8 000-particle GPU shader system with additive blending and full-field audio reactivity
- **Text overlay** — enter multiline text; first line renders bold and centered in the frame, subsequent lines appear below in a lighter weight (Playfair Display font)
- **Color themes** — pick primary and secondary colors; all visualizers respond
- **Sensitivity control** — global amplitude multiplier
- **Keyframe timeline** — animate color and sensitivity over time with click-to-add keyframes and smooth interpolation
- **Named presets** — save and recall full parameter snapshots (persisted to localStorage)
- **BPM detection** — live beat-per-minute readout via Meyda.js onset analysis
- **Video export** — record the canvas + audio to MP4/WebM via the MediaRecorder API at 30 or 60 fps

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS |
| 3D / GPU | Three.js (WebGL) |
| Audio analysis | Web Audio API + Meyda.js |
| State | Zustand |
| Build | Vite 6 |
| PWA | Service worker (stale-while-revalidate) |

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` and drop in an audio file (MP3, WAV, FLAC, AAC, etc.).

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

## Usage

1. **Drop an audio file** onto the landing screen — playback starts automatically.
2. **Select visualizers** in the sidebar (multiple can be active at once).
3. **Adjust colors and sensitivity** to taste.
4. **Add text** in the Text Overlay panel — first line is bold and centered, remaining lines appear below.
5. **Add keyframes** on the timeline to animate parameters across the track.
6. **Save a preset** to snapshot the current settings.
7. **Export** via the button in the top-right — choose 30 or 60 fps and download the video.

## Project Structure

```
src/
  audio/          # AudioEngine, AudioAnalyser, BpmTracker
  components/     # React UI components (sidebar, timeline, export dialog, …)
  keyframing/     # Keyframe types and interpolator
  rendering/      # Three.js Renderer and TextOverlay
  store/          # Zustand app state
  utils/          # Color palette helpers
  visualizers/    # SpectrumBars, Waveform, CircularViz, ParticleSystem
```

## License

MIT
