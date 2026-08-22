import type { DragEvent } from 'react'
import type { Card, Priority } from '../types'

const priorityStyles: Record<Priority, string> = {
  高: 'bg-red-100 text-red-700',
  中: 'bg-yellow-100 text-yellow-700',
  低: 'bg-blue-100 text-blue-700',
}

interface TaskCardProps {
  card: Card
  onClick?: () => void
  onDelete?: () => void
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void
  onDragEnd?: (event: DragEvent<HTMLDivElement>) => void
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void
  onDrop?: (event: DragEvent<HTMLDivElement>) => void
  isDragging?: boolean
  dropIndicator?: 'top' | 'bottom' | null
}

export function TaskCard({
  card,
  onClick,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  dropIndicator,
}: TaskCardProps) {
  const priorityStyle = priorityStyles[card.priority] ?? 'bg-gray-100 text-gray-700'

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative rounded-md border border-gray-200 bg-white p-3 shadow-sm ${onClick ? 'cursor-pointer hover:border-gray-300' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      {dropIndicator === 'top' && <div className="absolute inset-x-0 -top-1 h-0.5 rounded bg-blue-500" />}
      {dropIndicator === 'bottom' && <div className="absolute inset-x-0 -bottom-1 h-0.5 rounded bg-blue-500" />}
      {onDelete && (
        <button
          type="button"
          aria-label="タスクを削除"
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          className="absolute right-2 top-2 rounded px-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          ✕
        </button>
      )}
      <p className="pr-5 text-sm font-medium text-gray-900">{card.title}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${priorityStyle}`}>{card.priority}</span>
        {card.dueDate && <span className="text-xs text-gray-500">{card.dueDate}</span>}
      </div>
    </div>
  )
}
