import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Renderer } from '../../rendering/Renderer'
import { AudioAnalyser } from '../../audio/AudioAnalyser'
import { BpmTracker } from '../../audio/BpmTracker'
import type { VizName } from '../../visualizers/index'
import type { AudioEngine } from '../../audio/AudioEngine'
import type { VisualizerParams } from '../../visualizers/BaseVisualizer'

interface Props {
  engine: AudioEngine
  activeVizList: VizName[]
  overlayText: string
  getParams: () => VisualizerParams
  onBpm: (bpm: number) => void
}

export interface VisualizerCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
}

export const VisualizerCanvas = forwardRef<VisualizerCanvasHandle, Props>(
  function VisualizerCanvas({ engine, activeVizList, overlayText, getParams, onBpm }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<Renderer | null>(null)

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }))

    // Initialise renderer once per engine instance
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const renderer = new Renderer(canvas)
      const analyser = new AudioAnalyser(engine)
      const bpmTracker = new BpmTracker()
      bpmTracker.start(engine.context, engine.analyser)

      renderer.setAnalyser(analyser)
      renderer.start(getParams)
      rendererRef.current = renderer

      const bpmInterval = setInterval(() => {
        const bpm = bpmTracker.currentBpm
        analyser.updateBpm(bpm)
        onBpm(bpm)
      }, 250)

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) renderer.resize(entry.contentRect.width, entry.contentRect.height)
      })
      ro.observe(canvas.parentElement ?? canvas)

      return () => {
        clearInterval(bpmInterval)
        ro.disconnect()
        bpmTracker.stop()
        renderer.dispose()
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [engine])

    // Sync active visualizer set — diffs inside renderer so unchanged vizs are preserved
    useEffect(() => {
      rendererRef.current?.setVisualizers(activeVizList)
    }, [activeVizList])

    // Sync text overlay
    useEffect(() => {
      rendererRef.current?.setOverlayText(overlayText)
    }, [overlayText])

    return <canvas ref={canvasRef} className="w-full h-full block" />
  }
)
