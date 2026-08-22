import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NewTaskForm } from './NewTaskForm'

describe('NewTaskForm', () => {
  it('タイトル未入力で送信するとエラーメッセージを表示しonSubmitを呼ばない', () => {
    const onSubmit = vi.fn()
    render(<NewTaskForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    expect(screen.getByText('タイトルを入力してください。')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('タイトルを入力して送信するとonSubmitが呼ばれる', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<NewTaskForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('タイトル'), { target: { value: '新しいタスク' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: '新しいタスク', priority: '中', dueDate: null }),
      )
    })
  })

  it('onSubmitが失敗した場合はエラーメッセージを表示する', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('failed'))
    render(<NewTaskForm onSubmit={onSubmit} onCancel={vi.fn()} errorMessage="登録に失敗しました。" />)

    fireEvent.change(screen.getByPlaceholderText('タイトル'), { target: { value: '新しいタスク' } })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))

    await waitFor(() => {
      expect(screen.getByText('登録に失敗しました。')).toBeInTheDocument()
    })
  })

  it('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
    const onCancel = vi.fn()
    render(<NewTaskForm onSubmit={vi.fn()} onCancel={onCancel} />)

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
