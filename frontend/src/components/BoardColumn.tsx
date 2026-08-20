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
}

export function BoardColumn({ columnId, title, cards, onAddCard, onUpdateCard, onMoveCard }: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

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
      setDraggingCardId(cardId)
    }
  }

  function handleDragEnd() {
    setDraggingCardId(null)
    setDragOverIndex(null)
  }

  function handleDragOverSlot(index: number) {
    return (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setDragOverIndex(index)
    }
  }

  async function handleDropAtIndex(index: number) {
    if (!onMoveCard || columnId === undefined) return

    const draggedCardId = draggingCardId
    setDraggingCardId(null)
    setDragOverIndex(null)
    if (draggedCardId === null) return

    const visibleCards = cards.filter((card) => card.id !== draggedCardId)
    const afterCardId = index === 0 ? null : visibleCards[index - 1].id

    await onMoveCard(draggedCardId, columnId, afterCardId)
  }

  const dropSlotClass = (index: number) =>
    `h-2 rounded transition-colors ${dragOverIndex === index && draggingCardId !== null ? 'bg-blue-200' : ''}`

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50 p-3">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        {title} ({cards.length})
      </h2>
      <div className="flex flex-col gap-1">
        {onMoveCard && (
          <div
            className={dropSlotClass(0)}
            onDragOver={handleDragOverSlot(0)}
            onDrop={() => handleDropAtIndex(0)}
          />
        )}
        {cards.map((card, index) => (
          <div key={card.id} className="flex flex-col gap-1">
            {editingCardId === card.id ? (
              <NewTaskForm
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
                card={card}
                onClick={onUpdateCard ? () => setEditingCardId(card.id) : undefined}
                onDragStart={handleDragStart(card.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggingCardId === card.id}
              />
            )}
            {onMoveCard && (
              <div
                className={dropSlotClass(index + 1)}
                onDragOver={handleDragOverSlot(index + 1)}
                onDrop={() => handleDropAtIndex(index + 1)}
              />
            )}
          </div>
        ))}
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
