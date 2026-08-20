import { useState } from 'react'
import type { Card } from '../types'
import { TaskCard } from './TaskCard'
import { NewTaskForm } from './NewTaskForm'

interface BoardColumnProps {
  title: string
  cards: Card[]
  onAddCard?: (input: { title: string; description: string; priority: string; dueDate: string | null }) => Promise<void>
}

export function BoardColumn({ title, cards, onAddCard }: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false)

  async function handleSubmit(input: { title: string; description: string; priority: string; dueDate: string | null }) {
    if (!onAddCard) return
    await onAddCard(input)
    setIsAdding(false)
  }

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50 p-3">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">
        {title} ({cards.length})
      </h2>
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <TaskCard key={card.id} card={card} />
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
