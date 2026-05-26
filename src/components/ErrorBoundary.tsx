import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-lenz-bg text-white px-6">
          <p className="text-2xl font-semibold mb-2">Something went wrong.</p>
          <p className="text-sm text-white/40 mb-6">Please refresh the page.</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
