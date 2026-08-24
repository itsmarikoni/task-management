import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Card, TaskFormInput } from '../types'
import { TaskCard } from './TaskCard'
import { NewTaskForm } from './NewTaskForm'

interface BoardColumnProps {
  columnId: number
  title: string
  cards: Card[]
  onAddCard?: (input: TaskFormInput) => Promise<void>
  onUpdateCard?: (cardId: number, input: TaskFormInput) => Promise<void>
  onDeleteCard?: (cardId: number) => Promise<void>
  onSortCards?: (columnId: number, sortKey: 'PRIORITY' | 'DUE_DATE') => Promise<void>
  onRenameColumn?: (name: string) => Promise<void>
  onDeleteColumn?: () => Promise<void>
  draggingCardId: number | null
  dragOverCardId: number | null
  canReorder: boolean
}

export function BoardColumn({
  columnId,
  title,
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onSortCards,
  onRenameColumn,
  onDeleteColumn,
  draggingCardId,
  dragOverCardId,
  canReorder,
}: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [sorting, setSorting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)
  const [renaming, setRenaming] = useState(false)

  const { setNodeRef } = useDroppable({ id: `column-${columnId}`, data: { columnId } })

  async function handleSort(sortKey: 'PRIORITY' | 'DUE_DATE') {
    if (!onSortCards || sorting) return
    try {
      setSorting(true)
      await onSortCards(columnId, sortKey)
    } finally {
      setSorting(false)
    }
  }

  function startEditingTitle() {
    if (!onRenameColumn) return
    setTitleInput(title)
    setIsEditingTitle(true)
  }

  async function handleRenameSubmit() {
    if (!onRenameColumn) return
    const trimmed = titleInput.trim()
    if (!trimmed || trimmed === title) {
      setIsEditingTitle(false)
      return
    }
    try {
      setRenaming(true)
      await onRenameColumn(trimmed)
      setIsEditingTitle(false)
    } finally {
      setRenaming(false)
    }
  }

  async function handleDeleteColumn() {
    if (!onDeleteColumn) return
    if (!window.confirm('このカラムを削除しますか？カラム内のタスクも全て削除され、この操作は取り消せません。')) return
    await onDeleteColumn()
  }

  async function handleSubmit(input: TaskFormInput) {
    if (!onAddCard) return
    await onAddCard(input)
    setIsAdding(false)
  }

  async function handleUpdate(cardId: number, input: TaskFormInput) {
    if (!onUpdateCard) return
    await onUpdateCard(cardId, input)
    setEditingCardId(null)
  }

  async function handleDelete(cardId: number) {
    if (!onDeleteCard) return
    if (!window.confirm('このタスクを削除しますか？この操作は取り消せません。')) return
    await onDeleteCard(cardId)
  }

  function dropIndicatorFor(card: Card): 'top' | 'bottom' | null {
    if (draggingCardId === null || dragOverCardId !== card.id || card.id === draggingCardId) return null
    return 'top'
  }

  return (
    <div ref={setNodeRef} className="flex w-full flex-shrink-0 flex-col rounded-lg bg-gray-50 p-3 sm:w-72">
      <div className="mb-3 flex items-center justify-between">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(event) => setTitleInput(event.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleRenameSubmit()
              } else if (event.key === 'Escape') {
                setIsEditingTitle(false)
              }
            }}
            maxLength={50}
            autoFocus
            disabled={renaming}
            className="rounded border border-gray-300 px-1 py-0.5 text-sm font-semibold text-gray-700"
          />
        ) : (
          <h2
            onClick={onRenameColumn ? startEditingTitle : undefined}
            className={`text-sm font-semibold text-gray-700 ${onRenameColumn ? 'cursor-pointer hover:underline' : ''}`}
          >
            {title} ({cards.length})
          </h2>
        )}
        <div className="flex items-center gap-1">
          {onSortCards && (
            <>
              <button
                type="button"
                onClick={() => handleSort('PRIORITY')}
                disabled={sorting}
                className="min-h-11 rounded px-2 text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-50 sm:min-h-0 sm:px-1.5 sm:py-0.5"
                title="優先度順に並び替え"
              >
                優先度
              </button>
              <button
                type="button"
                onClick={() => handleSort('DUE_DATE')}
                disabled={sorting}
                className="min-h-11 rounded px-2 text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-50 sm:min-h-0 sm:px-1.5 sm:py-0.5"
                title="期限順に並び替え"
              >
                期限
              </button>
            </>
          )}
          {onDeleteColumn && (
            <button
              type="button"
              aria-label="カラムを削除"
              onClick={handleDeleteColumn}
              className="flex min-h-11 min-w-11 items-center justify-center rounded text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:py-0.5"
              title="カラムを削除"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-8 flex-col gap-2">
          {cards.map((card) =>
            editingCardId === card.id ? (
              <NewTaskForm
                key={card.id}
                initialValues={{
                  title: card.title,
                  description: card.description,
                  priority: card.priority,
                  dueDate: card.dueDate,
                }}
                submitLabel="保存"
                errorMessage="タスクの更新に失敗しました。"
                onSubmit={(input) => handleUpdate(card.id, input)}
                onCancel={() => setEditingCardId(null)}
              />
            ) : (
              <TaskCard
                key={card.id}
                card={card}
                onClick={onUpdateCard ? () => setEditingCardId(card.id) : undefined}
                onDelete={onDeleteCard ? () => handleDelete(card.id) : undefined}
                disabled={!canReorder}
                dropIndicator={dropIndicatorFor(card)}
              />
            ),
          )}
        </div>
      </SortableContext>
      {onAddCard && (
        <div className="mt-2">
          {isAdding ? (
            <NewTaskForm onSubmit={handleSubmit} onCancel={() => setIsAdding(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="min-h-11 w-full rounded px-2 py-1 text-left text-sm text-gray-500 hover:bg-gray-100 sm:min-h-0"
            >
              + タスク追加
            </button>
          )}
        </div>
      )}
    </div>
  )
}
