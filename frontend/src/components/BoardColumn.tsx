import { useState } from 'react'
import type { DragEvent } from 'react'
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
  onMoveCard?: (cardId: number, columnId: number, afterCardId: number | null) => Promise<void>
  onSortCards?: (columnId: number, sortKey: 'PRIORITY' | 'DUE_DATE') => Promise<void>
  onRenameColumn?: (name: string) => Promise<void>
  onDeleteColumn?: () => Promise<void>
  draggingCardId: number | null
  onDragStateChange: (cardId: number | null) => void
}

interface DropTarget {
  afterCardId: number | null
}

export function BoardColumn({
  columnId,
  title,
  cards,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  onSortCards,
  onRenameColumn,
  onDeleteColumn,
  draggingCardId,
  onDragStateChange,
}: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [sorting, setSorting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(title)
  const [renaming, setRenaming] = useState(false)

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

  function handleDragStart(cardId: number) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData('text/plain', String(cardId))
      event.dataTransfer.effectAllowed = 'move'
      onDragStateChange(cardId)
    }
  }

  function handleDragEnd() {
    onDragStateChange(null)
    setDropTarget(null)
  }

  function handleCardDragOver(card: Card, index: number) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'move'

      const rect = event.currentTarget.getBoundingClientRect()
      const isTopHalf = event.clientY < rect.top + rect.height / 2
      const previousCard = cards[index - 1]

      if (isTopHalf) {
        setDropTarget({ afterCardId: previousCard && previousCard.id !== draggingCardId ? previousCard.id : null })
      } else {
        setDropTarget({ afterCardId: card.id })
      }
    }
  }

  function handleColumnDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const lastCard = cards[cards.length - 1]
    const afterCardId = lastCard && lastCard.id !== draggingCardId ? lastCard.id : null
    setDropTarget({ afterCardId })
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (!onMoveCard) return

    const draggedCardId = draggingCardId
    const target = dropTarget
    onDragStateChange(null)
    setDropTarget(null)
    if (draggedCardId === null || !target) return
    if (target.afterCardId === draggedCardId) return

    await onMoveCard(draggedCardId, columnId, target.afterCardId)
  }

  function dropIndicatorFor(card: Card, index: number): 'top' | 'bottom' | null {
    if (!dropTarget || draggingCardId === null) return null
    const previousCard = cards[index - 1]

    if (dropTarget.afterCardId === card.id) return 'bottom'
    if (dropTarget.afterCardId === null && !previousCard) return 'top'
    if (previousCard && dropTarget.afterCardId === previousCard.id && card.id !== draggingCardId) {
      return 'top'
    }
    return null
  }

  return (
    <div
      className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50 p-3"
      onDragOver={onMoveCard ? handleColumnDragOver : undefined}
      onDrop={onMoveCard ? handleDrop : undefined}
    >
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
                className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                title="優先度順に並び替え"
              >
                優先度
              </button>
              <button
                type="button"
                onClick={() => handleSort('DUE_DATE')}
                disabled={sorting}
                className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200 disabled:opacity-50"
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
              className="rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="カラムを削除"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {cards.map((card, index) =>
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
              onDragStart={handleDragStart(card.id)}
              onDragEnd={handleDragEnd}
              onDragOver={onMoveCard ? handleCardDragOver(card, index) : undefined}
              onDrop={onMoveCard ? handleDrop : undefined}
              isDragging={draggingCardId === card.id}
              dropIndicator={dropIndicatorFor(card, index)}
            />
          ),
        )}
      </div>
      {onAddCard && (
        <div className="mt-2">
          {isAdding ? (
            <NewTaskForm onSubmit={handleSubmit} onCancel={() => setIsAdding(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full rounded px-2 py-1 text-left text-sm text-gray-500 hover:bg-gray-100"
            >
              + タスク追加
            </button>
          )}
        </div>
      )}
    </div>
  )
}
