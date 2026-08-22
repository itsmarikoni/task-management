import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

function ThrowingComponent(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('子要素が正常な場合はそのまま表示する', () => {
    render(
      <ErrorBoundary>
        <p>正常な内容</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('正常な内容')).toBeInTheDocument()
  })

  it('子要素が例外を投げた場合はフォールバックUIを表示する', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText('予期しないエラーが発生しました。ページを再読み込みしてください。')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
