import { Component, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props { children: ReactNode; pageName?: string }
interface State { hasError: boolean }

export default class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 gap-4">
          <div className="w-14 h-14 rounded-full bg-lenz-card flex items-center justify-center">
            <RefreshCw size={22} className="text-white/30" />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm font-medium">Something went wrong</p>
            {this.props.pageName && (
              <p className="text-white/25 text-xs mt-1">{this.props.pageName} failed to load</p>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-5 py-2.5 rounded-full border border-lenz-border text-white/50 text-sm hover:border-gold/40 hover:text-gold/70 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
