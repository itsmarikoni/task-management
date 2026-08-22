import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TaskCard } from './TaskCard'
import type { Card } from '../types'

const baseCard: Card = {
  id: 1,
  columnId: 1,
  title: 'タイトル',
  description: '説明',
  priority: '高',
  dueDate: '2026-01-01',
  displayOrder: 0,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
}

describe('TaskCard', () => {
  it('タイトルと優先度を表示する', () => {
    render(<TaskCard card={baseCard} />)

    expect(screen.getByText('タイトル')).toBeInTheDocument()
    expect(screen.getByText('高')).toBeInTheDocument()
  })

  it('期限が設定されている場合は表示する', () => {
    render(<TaskCard card={baseCard} />)

    expect(screen.getByText('2026-01-01')).toBeInTheDocument()
  })

  it('期限がnullの場合は表示しない', () => {
    render(<TaskCard card={{ ...baseCard, dueDate: null }} />)

    expect(screen.queryByText('2026-01-01')).not.toBeInTheDocument()
  })

  it('削除ボタンをクリックするとonDeleteが呼ばれる', () => {
    const onDelete = vi.fn()
    render(<TaskCard card={baseCard} onDelete={onDelete} />)

    fireEvent.click(screen.getByLabelText('タスクを削除'))

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('onDeleteが未指定の場合は削除ボタンを表示しない', () => {
    render(<TaskCard card={baseCard} />)

    expect(screen.queryByLabelText('タスクを削除')).not.toBeInTheDocument()
  })
})
