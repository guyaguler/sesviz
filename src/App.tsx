import { useCallback, useRef, useState } from 'react'
import { AudioEngine } from './audio/AudioEngine'
import { AudioDropzone } from './components/dropzone/AudioDropzone'
import { VisualizerCanvas, type VisualizerCanvasHandle } from './components/canvas/VisualizerCanvas'
import { PlaybackBar } from './components/controls/PlaybackBar'
import { VizSelector } from './components/sidebar/VizSelector'
import { ColorThemePanel } from './components/sidebar/ColorThemePanel'
import { SensitivityControls } from './components/sidebar/SensitivityControls'
import { BpmDisplay } from './components/sidebar/BpmDisplay'
import { PresetList } from './components/presets/PresetList'
import { TextOverlayPanel } from './components/sidebar/TextOverlayPanel'
import { Timeline } from './components/timeline/Timeline'
import { ExportDialog } from './components/export/ExportDialog'
import { useAppStore } from './store/appStore'
import { resolveParams } from './keyframing/KeyframeInterpolator'
import type { VisualizerParams } from './visualizers/BaseVisualizer'
import type { KeyframeTracks } from './keyframing/types'

type LoadState = 'idle' | 'loading' | 'error'

export default function App() {
  const [engine] = useState(() => new AudioEngine())
  const [bpm, setBpm] = useState(120)
  const [showExport, setShowExport] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [loadError, setLoadError] = useState<string | null>(null)
  const vizRef = useRef<VisualizerCanvasHandle>(null)

  const {
    fileName, setFile,
    primaryColor, secondaryColor, sensitivity,
    activeVizList, toggleViz,
    overlayText,
    currentTime, duration,
  } = useAppStore()

  const liveRef = useRef<{
    primaryColor: string
    secondaryColor: string
    sensitivity: number
    keyframeTracks: KeyframeTracks
    engine: AudioEngine
  }>({
    primaryColor,
    secondaryColor,
    sensitivity,
    keyframeTracks: useAppStore.getState().keyframeTracks,
    engine,
  })

  liveRef.current.primaryColor = primaryColor
  liveRef.current.secondaryColor = secondaryColor
  liveRef.current.sensitivity = sensitivity
  liveRef.current.keyframeTracks = useAppStore.getState().keyframeTracks

  const getParams = useCallback((): VisualizerParams => {
    const { primaryColor, secondaryColor, sensitivity, keyframeTracks, engine } = liveRef.current
    return resolveParams(keyframeTracks, engine.currentTime, { primaryColor, secondaryColor, sensitivity })
  }, [])

  const handleLoad = useCallback(async (file: File) => {
    setLoadState('loading')
    setLoadError(null)
    try {
      engine.stop()
      await engine.load(file)
      setFile(file.name, engine.duration)
      await engine.play()
      useAppStore.getState().setPlaying(true)
      setLoadState('idle')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load audio file'
      setLoadError(msg)
      setLoadState('error')
    }
  }, [engine, setFile])

  const handleNewFile = useCallback(() => {
    engine.stop()
    useAppStore.setState({
      fileName: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })
    setLoadState('idle')
    setLoadError(null)
  }, [engine])

  const isLoaded = !!fileName && loadState !== 'loading'

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 flex-shrink-0">
        <span className="text-lg font-semibold tracking-tight text-cyan-400">SesViz</span>
        <div className="flex items-center gap-3">
          {fileName && loadState !== 'loading' && (
            <span className="text-zinc-400 text-sm truncate max-w-xs">{fileName}</span>
          )}
          {isLoaded && (
            <button
              onClick={handleNewFile}
              title="Load a new file"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Change
            </button>
          )}
          {isLoaded && (
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
              </svg>
              Export
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas + timeline column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-hidden">
            {loadState === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 z-10">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                <p className="text-zinc-400 text-sm">Decoding audio…</p>
              </div>
            )}

            {loadState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 z-10">
                <p className="text-red-400 text-sm font-medium">Failed to load file</p>
                <p className="text-zinc-500 text-xs max-w-xs text-center">{loadError}</p>
                <button
                  onClick={() => setLoadState('idle')}
                  className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors mt-2"
                >
                  Try again
                </button>
              </div>
            )}

            {isLoaded ? (
              <VisualizerCanvas
                ref={vizRef}
                engine={engine}
                activeVizList={activeVizList}
                overlayText={overlayText}
                getParams={getParams}
                onBpm={setBpm}
              />
            ) : loadState === 'idle' ? (
              <AudioDropzone onLoad={handleLoad} />
            ) : null}
          </main>

          {isLoaded && <Timeline duration={duration} currentTime={currentTime} />}
        </div>

        {/* Sidebar */}
        {isLoaded && (
          <aside className="w-60 flex-shrink-0 border-l border-zinc-800 bg-zinc-900 flex flex-col gap-5 p-5 overflow-y-auto">
            <BpmDisplay bpm={bpm} />
            <hr className="border-zinc-800" />
            <VizSelector activeList={activeVizList} onToggle={toggleViz} />
            <hr className="border-zinc-800" />
            <ColorThemePanel />
            <hr className="border-zinc-800" />
            <SensitivityControls />
            <hr className="border-zinc-800" />
            <PresetList />
            <hr className="border-zinc-800" />
            <TextOverlayPanel />
          </aside>
        )}
      </div>

      {isLoaded && <PlaybackBar engine={engine} />}

      {showExport && (
        <ExportDialog
          engine={engine}
          vizRef={vizRef}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
