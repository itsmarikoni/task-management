import type { Card } from '../types'
import { TaskCard } from './TaskCard'

interface BoardColumnProps {
  title: string
  cards: Card[]
}

export function BoardColumn({ title, cards }: BoardColumnProps) {
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
    </div>
  )
}
