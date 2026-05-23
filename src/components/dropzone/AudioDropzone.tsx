import { useCallback, useState } from 'react'
import { AudioEngine } from '../../audio/AudioEngine'

interface Props {
  onLoad: (file: File) => void
}

export function AudioDropzone({ onLoad }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    if (!AudioEngine.isSupported(file)) {
      setError(`Unsupported format. Use MP3, WAV, AIFF, FLAC, or M4A.`)
      return
    }
    onLoad(file)
  }, [onLoad])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <label
        className={`flex flex-col items-center justify-center w-96 h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-colors
          ${dragging ? 'border-cyan-400 bg-cyan-400/10' : 'border-zinc-600 bg-zinc-900 hover:border-zinc-400'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <svg className="w-12 h-12 text-zinc-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
        </svg>
        <p className="text-zinc-300 text-sm font-medium">Drop an audio file here</p>
        <p className="text-zinc-500 text-xs mt-1">MP3, WAV, AIFF, FLAC, M4A</p>
        <input type="file" className="hidden" accept=".mp3,.wav,.aif,.aiff,.flac,.m4a,audio/*" onChange={onInputChange} />
      </label>
      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </div>
  )
}
