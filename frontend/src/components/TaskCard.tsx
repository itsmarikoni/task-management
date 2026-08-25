import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  disabled?: boolean
  dropIndicator?: 'top' | 'bottom' | null
}

export function TaskCard({ card, onClick, onDelete, disabled, dropIndicator }: TaskCardProps) {
  const priorityStyle = priorityStyles[card.priority] ?? 'bg-gray-100 text-gray-700'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`relative touch-none rounded-md border border-gray-200 bg-white p-3 shadow-sm ${onClick ? 'cursor-pointer hover:border-gray-300' : ''} ${isDragging ? 'opacity-40' : ''}`}
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
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 sm:h-6 sm:w-6"
        >
          ✕
        </button>
      )}
      <p className="pr-10 text-sm font-medium text-gray-900 sm:pr-5">{card.title}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${priorityStyle}`}>{card.priority}</span>
        {card.dueDate && <span className="text-xs text-gray-500">{card.dueDate}</span>}
      </div>
    </div>
  )
}
