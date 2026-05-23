# SesViz — Audio Visualization App

## Overview

SesViz takes an audio file and generates attractive, dynamic visualizations that react in real time to the audio's physical characteristics. The goal is to give musicians, producers, and music fans a simple way to turn any track into a compelling visual experience or shareable video.

---

## Goals

- Load a local audio file and instantly see a synchronized, reactive visualization
- Support multiple visualization styles to suit different genres and moods
- Export the result as a video file suitable for sharing
- Keep the interface simple enough for non-technical users

---

## Target Users

- Music producers who want visualizer videos for their releases
- Fans who want to create video content from their favorite tracks
- Performers who want a live visual backdrop during a set

---

## Features

### Audio Input
- Supported formats: MP3, WAV, AIFF, FLAC, M4A
- Load via file picker or drag-and-drop
- Playback controls: play, pause, seek, loop

### Visualization
- Multiple visual styles (e.g. frequency spectrum bars, waveform, particle system, circular visualizer)
- Visuals react to:
  - **Amplitude** — overall loudness drives size/brightness
  - **Frequency bands** — bass, mid, treble drive separate visual elements
  - **Transients** — drum hits and note attacks trigger impulse effects
  - **BPM / tempo** — rhythmic elements sync to beat; BPM is detected automatically and tracked continuously to handle tempo fluctuations throughout the track
- Color themes: preset palettes + custom color picker
- Real-time preview at full quality during playback

### Presets
- Users can save the current visualization configuration (style, colors, sensitivity, keyframes) as a named preset
- Presets persist across sessions and can be loaded at any time

### Keyframing
- Users can set parameter changes (color, sensitivity, style transitions) at specific timestamps on a timeline
- Basic keyframing is supported in v1

### Export
- Output format: MP4 (H.264)
- Resolutions: 1080p (default), 720p, 4K
- Frame rate: 60 fps
- Export time target: no more than 2× the track duration

---

## Non-Goals

- Audio editing or mixing (SesViz is visualization-only)
- Real-time microphone or live input
- Built-in social sharing or cloud upload
- Support for video input files
- Audio format conversion
- Logic Pro or DAW integration

---

## Technical Requirements

- **Platform:** Web app — runs in any modern browser, no installation required; cross-platform by default (macOS, Windows, Linux)
- **Framework:** React + TypeScript
- **Rendering:** Three.js (WebGL) for GPU-accelerated 60fps visuals
- **Audio analysis:** Web Audio API (built-in browser API) for FFT, amplitude, frequency bands, and transient detection
- **BPM tracking:** Essentia.js or Meyda for continuous, adaptive tempo detection
- **Video export:** ffmpeg.wasm (runs fully client-side, no server required)
- **Styling:** Tailwind CSS
- **Performance:** smooth 60 fps preview on mid-range hardware
- **Offline:** all functionality works without an internet connection once the app is loaded
- **Maximum supported file size:** 500 MB

---

## Success Criteria

- A user can load an MP3 and begin seeing a synchronized visualization within 3 seconds
- A user can export a 1080p/60fps MP4 in under 2× the track's duration
- At least 3 distinct visual styles are available at launch
- The app runs without errors in Chrome, Firefox, and Safari (latest versions)

---

