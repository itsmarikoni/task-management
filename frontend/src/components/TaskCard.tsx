import type { Card } from '../types'

const priorityStyles: Record<string, string> = {
  高: 'bg-red-100 text-red-700',
  中: 'bg-yellow-100 text-yellow-700',
  低: 'bg-blue-100 text-blue-700',
}

interface TaskCardProps {
  card: Card
}

export function TaskCard({ card }: TaskCardProps) {
  const priorityStyle = priorityStyles[card.priority] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-gray-900">{card.title}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${priorityStyle}`}>
          {card.priority}
        </span>
        {card.dueDate && (
          <span className="text-xs text-gray-500">{card.dueDate}</span>
        )}
      </div>
    </div>
  )
}
