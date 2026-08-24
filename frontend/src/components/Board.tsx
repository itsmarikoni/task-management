import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Card, Column, TaskFormInput } from '../types'
import {
  createColumn,
  deleteColumn,
  getCardsByColumn,
  getColumns,
  sortCardsByColumn,
  updateColumn,
} from '../api/columns'
import type { CardSortKey } from '../api/columns'
import { createCard, deleteCard, updateCard, updateCardPosition } from '../api/cards'
import { BoardColumn } from './BoardColumn'

export function Board() {
  const [columns, setColumns] = useState<Column[]>([])
  const [cardsByColumnId, setCardsByColumnId] = useState<Map<number, Card[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<number | null>(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [addColumnError, setAddColumnError] = useState<string | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const allColumns = [...(await getColumns())].sort((a, b) => a.displayOrder - b.displayOrder)

        const entries = await Promise.all(
          allColumns.map(async (column) => [column.id, await getCardsByColumn(column.id)] as const),
        )

        if (!cancelled) {
          setColumns(allColumns)
          setCardsByColumnId(new Map(entries))
        }
      } catch {
        if (!cancelled) {
          setError('タスクの取得に失敗しました。バックエンドが起動しているか確認してください。')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">読み込み中...</p>
  }

  if (error) {
    return <p className="p-6 text-sm text-red-600">{error}</p>
  }

  async function handleAddCard(columnId: number, input: TaskFormInput) {
    const created = await createCard({ columnId, ...input })
    setCardsByColumnId((prev) => {
      const next = new Map(prev)
      next.set(columnId, [...(next.get(columnId) ?? []), created])
      return next
    })
  }

  async function handleUpdateCard(columnId: number, cardId: number, input: TaskFormInput) {
    const updated = await updateCard(cardId, { columnId, ...input })
    setCardsByColumnId((prev) => {
      const next = new Map(prev)
      next.set(
        columnId,
        (next.get(columnId) ?? []).map((card) => (card.id === updated.id ? updated : card)),
      )
      return next
    })
  }

  async function handleDeleteCard(columnId: number, cardId: number) {
    try {
      setActionError(null)
      await deleteCard(cardId)
      setCardsByColumnId((prev) => {
        const next = new Map(prev)
        next.set(
          columnId,
          (next.get(columnId) ?? []).filter((card) => card.id !== cardId),
        )
        return next
      })
    } catch {
      setActionError('タスクの削除に失敗しました。')
    }
  }

  function findColumnIdForCard(cardId: number): number | undefined {
    return [...cardsByColumnId.entries()].find(([, cards]) => cards.some((card) => card.id === cardId))?.[0]
  }

  function resolveDropTarget(overId: string | number): { columnId: number; afterCardId: number | null } | null {
    if (typeof overId === 'string' && overId.startsWith('column-')) {
      const columnId = Number(overId.slice('column-'.length))
      const cards = cardsByColumnId.get(columnId) ?? []
      const lastCard = cards[cards.length - 1]
      return { columnId, afterCardId: lastCard ? lastCard.id : null }
    }

    const overCardId = Number(overId)
    const columnId = findColumnIdForCard(overCardId)
    if (columnId === undefined) return null
    const cards = cardsByColumnId.get(columnId) ?? []
    const overIndex = cards.findIndex((card) => card.id === overCardId)
    const previousCard = cards[overIndex - 1]
    return { columnId, afterCardId: previousCard ? previousCard.id : null }
  }

  function handleDragStart(event: DragStartEvent) {
    setDraggingCardId(Number(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    if (!event.over) {
      setDragOverCardId(null)
      return
    }
    const overId = event.over.id
    setDragOverCardId(typeof overId === 'string' && overId.startsWith('column-') ? null : Number(overId))
  }

  async function handleDragEnd(event: DragEndEvent) {
    const cardId = draggingCardId
    setDraggingCardId(null)
    setDragOverCardId(null)
    if (cardId === null || !event.over) return

    const target = resolveDropTarget(event.over.id)
    if (!target || target.afterCardId === cardId) return

    await handleMoveCard(cardId, target.columnId, target.afterCardId)
  }

  async function handleMoveCard(cardId: number, targetColumnId: number, afterCardId: number | null) {
    const sourceColumnId = [...cardsByColumnId.entries()].find(([, cards]) =>
      cards.some((card) => card.id === cardId),
    )?.[0]
    if (sourceColumnId === undefined) return

    try {
      setActionError(null)
      const movedCard = await updateCardPosition(cardId, { columnId: targetColumnId, afterCardId })

      setCardsByColumnId((prev) => {
        const next = new Map(prev)

        const remaining = (next.get(sourceColumnId) ?? []).filter((card) => card.id !== cardId)
        if (sourceColumnId === targetColumnId) {
          const insertIndex = afterCardId === null ? 0 : remaining.findIndex((card) => card.id === afterCardId) + 1
          remaining.splice(insertIndex, 0, movedCard)
          next.set(targetColumnId, remaining)
          return next
        }

        next.set(sourceColumnId, remaining)
        const destination = [...(next.get(targetColumnId) ?? [])]
        const insertIndex = afterCardId === null ? 0 : destination.findIndex((card) => card.id === afterCardId) + 1
        destination.splice(insertIndex, 0, movedCard)
        next.set(targetColumnId, destination)
        return next
      })
    } catch {
      setActionError('タスクの移動に失敗しました。')
    }
  }

  async function handleSortCards(columnId: number, sortKey: CardSortKey) {
    try {
      setActionError(null)
      const sorted = await sortCardsByColumn(columnId, sortKey)
      setCardsByColumnId((prev) => {
        const next = new Map(prev)
        next.set(columnId, sorted)
        return next
      })
    } catch {
      setActionError('並び替えに失敗しました。')
    }
  }

  async function handleRenameColumn(columnId: number, name: string) {
    try {
      setActionError(null)
      const updated = await updateColumn(columnId, name)
      setColumns((prev) => prev.map((column) => (column.id === updated.id ? updated : column)))
    } catch {
      setActionError('カラム名の変更に失敗しました。')
    }
  }

  async function handleDeleteColumn(columnId: number) {
    try {
      setActionError(null)
      await deleteColumn(columnId)
      setColumns((prev) => prev.filter((column) => column.id !== columnId))
      setCardsByColumnId((prev) => {
        const next = new Map(prev)
        next.delete(columnId)
        return next
      })
    } catch {
      setActionError('カラムの削除に失敗しました。')
    }
  }

  async function handleAddColumnSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = newColumnName.trim()
    if (!trimmed) {
      setAddColumnError('カラム名を入力してください。')
      return
    }

    try {
      setAddingColumn(true)
      setAddColumnError(null)
      const created = await createColumn(trimmed)
      setColumns((prev) => [...prev, created])
      setCardsByColumnId((prev) => {
        const next = new Map(prev)
        next.set(created.id, [])
        return next
      })
      setNewColumnName('')
      setIsAddingColumn(false)
    } catch {
      setAddColumnError('カラムの追加に失敗しました。')
    } finally {
      setAddingColumn(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-6">
      {actionError && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      )}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4 sm:flex-row sm:overflow-x-auto">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              columnId={column.id}
              title={column.name}
              cards={cardsByColumnId.get(column.id) ?? []}
              onAddCard={(input) => handleAddCard(column.id, input)}
              onUpdateCard={(cardId, input) => handleUpdateCard(column.id, cardId, input)}
              onDeleteCard={(cardId) => handleDeleteCard(column.id, cardId)}
              onSortCards={handleSortCards}
              onRenameColumn={(name) => handleRenameColumn(column.id, name)}
              onDeleteColumn={() => handleDeleteColumn(column.id)}
              draggingCardId={draggingCardId}
              dragOverCardId={dragOverCardId}
              canReorder
            />
          ))}
          <div className="w-full flex-shrink-0 sm:w-72">
          {isAddingColumn ? (
            <form
              onSubmit={handleAddColumnSubmit}
              className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3"
            >
              <input
                type="text"
                value={newColumnName}
                onChange={(event) => setNewColumnName(event.target.value)}
                placeholder="カラム名"
                maxLength={50}
                autoFocus
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
              {addColumnError && <p className="text-xs text-red-600">{addColumnError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingColumn(false)
                    setNewColumnName('')
                    setAddColumnError(null)
                  }}
                  className="min-h-11 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 sm:min-h-0"
                  disabled={addingColumn}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:min-h-0"
                  disabled={addingColumn}
                >
                  追加
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingColumn(true)}
              className="min-h-11 w-full rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
            >
              + カラム追加
            </button>
          )}
          </div>
        </div>
      </DndContext>
    </div>
  )
}
