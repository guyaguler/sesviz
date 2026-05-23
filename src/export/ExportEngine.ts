export type ExportFormat = 'webm' | 'mp4'

export interface ExportOptions {
  fps: 30 | 60
}

export interface ExportSession {
  stop: () => Promise<Blob>
  mimeType: string
}

function detectMimeType(): string {
  const candidates = [
    'video/mp4;codecs=h264,aac',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
}

export function startExport(
  canvas: HTMLCanvasElement,
  audioStream: MediaStream,
  opts: ExportOptions,
): ExportSession {
  const mimeType = detectMimeType()
  const videoStream = canvas.captureStream(opts.fps)

  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ])

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(combined, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
    audioBitsPerSecond: 192_000,
  })

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  recorder.start(200)

  const stop = (): Promise<Blob> =>
    new Promise((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
      if (recorder.state !== 'inactive') recorder.stop()
    })

  return { stop, mimeType }
}

export function triggerDownload(blob: Blob, mimeType: string, trackName: string): void {
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
  const name = trackName.replace(/\.[^.]+$/, '') + `-sesviz.${ext}`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
