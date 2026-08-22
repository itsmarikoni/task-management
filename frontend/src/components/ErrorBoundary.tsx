import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled error in component tree:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-sm text-red-600">
          予期しないエラーが発生しました。ページを再読み込みしてください。
        </div>
      )
    }

    return this.props.children
  }
}
