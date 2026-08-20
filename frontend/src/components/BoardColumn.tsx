import { useState } from 'react'
import type { Card } from '../types'
import { TaskCard } from './TaskCard'
import { NewTaskForm } from './NewTaskForm'

interface BoardColumnProps {
  title: string
  cards: Card[]
  onAddCard?: (input: { title: string; description: string; priority: string; dueDate: string | null }) => Promise<void>
  onUpdateCard?: (cardId: number, input: { title: string; description: string; priority: string; dueDate: string | null }) => Promise<void>
}

export function BoardColumn({ title, cards, onAddCard, onUpdateCard }: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCardId, setEditingCardId] = useState<number | null>(null)

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

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50 p-3">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        {title} ({cards.length})
      </h2>
      <div className="flex flex-col gap-2">
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
