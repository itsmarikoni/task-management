import { useState } from 'react'
import type { DragEvent } from 'react'
import type { Card } from '../types'
import { TaskCard } from './TaskCard'
import { NewTaskForm } from './NewTaskForm'

interface BoardColumnProps {
  columnId?: number
  title: string
  cards: Card[]
  onAddCard?: (input: { title: string; description: string; priority: string; dueDate: string | null }) => Promise<void>
  onUpdateCard?: (cardId: number, input: { title: string; description: string; priority: string; dueDate: string | null }) => Promise<void>
  onMoveCard?: (cardId: number, columnId: number, afterCardId: number | null) => Promise<void>
  onSortCards?: (columnId: number, sortKey: 'PRIORITY' | 'DUE_DATE') => Promise<void>
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
  onMoveCard,
  onSortCards,
  draggingCardId,
  onDragStateChange,
}: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [sorting, setSorting] = useState(false)

  async function handleSort(sortKey: 'PRIORITY' | 'DUE_DATE') {
    if (!onSortCards || columnId === undefined || sorting) return
    try {
      setSorting(true)
      await onSortCards(columnId, sortKey)
    } finally {
      setSorting(false)
    }
  }

  async function handleSubmit(input: { title: string; description: string; priority: string; dueDate: string | null }) {
    if (!onAddCard) return
    await onAddCard(input)
    setIsAdding(false)
  }

  async function handleUpdate(cardId: number, input: { title: string; description: string; priority: string; dueDate: string | null }) {
    if (!onUpdateCard) return
    await onUpdateCard(cardId, input)
    setEditingCardId(null)
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
    if (!onMoveCard || columnId === undefined) return

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
        <h2 className="text-sm font-semibold text-gray-700">
          {title} ({cards.length})
        </h2>
        {onSortCards && (
          <div className="flex gap-1">
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
          </div>
        )}
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
