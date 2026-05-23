import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center w-screen h-screen bg-zinc-950 text-white gap-4">
          <p className="text-red-400 font-medium">Something went wrong</p>
          <p className="text-zinc-500 text-sm max-w-sm text-center">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
