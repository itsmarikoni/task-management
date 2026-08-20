import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Card, Column } from '../types'
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
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [addColumnError, setAddColumnError] = useState<string | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)

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

  if (loading) {
    return <p className="p-6 text-sm text-gray-500">読み込み中...</p>
  }

  if (error) {
    return <p className="p-6 text-sm text-red-600">{error}</p>
  }

  async function handleAddCard(
    columnId: number,
    input: { title: string; description: string; priority: string; dueDate: string | null },
  ) {
    const created = await createCard({ columnId, ...input })
    setCardsByColumnId((prev) => {
      const next = new Map(prev)
      next.set(columnId, [...(next.get(columnId) ?? []), created])
      return next
    })
  }

  async function handleUpdateCard(
    columnId: number,
    cardId: number,
    input: { title: string; description: string; priority: string; dueDate: string | null },
  ) {
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
    await deleteCard(cardId)
    setCardsByColumnId((prev) => {
      const next = new Map(prev)
      next.set(columnId, (next.get(columnId) ?? []).filter((card) => card.id !== cardId))
      return next
    })
  }

  async function handleMoveCard(cardId: number, targetColumnId: number, afterCardId: number | null) {
    const sourceColumnId = [...cardsByColumnId.entries()].find(([, cards]) =>
      cards.some((card) => card.id === cardId),
    )?.[0]
    if (sourceColumnId === undefined) return

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
  }

  async function handleSortCards(columnId: number, sortKey: CardSortKey) {
    const sorted = await sortCardsByColumn(columnId, sortKey)
    setCardsByColumnId((prev) => {
      const next = new Map(prev)
      next.set(columnId, sorted)
      return next
    })
  }

  async function handleRenameColumn(columnId: number, name: string) {
    const updated = await updateColumn(columnId, name)
    setColumns((prev) => prev.map((column) => (column.id === updated.id ? updated : column)))
  }

  async function handleDeleteColumn(columnId: number) {
    await deleteColumn(columnId)
    setColumns((prev) => prev.filter((column) => column.id !== columnId))
    setCardsByColumnId((prev) => {
      const next = new Map(prev)
      next.delete(columnId)
      return next
    })
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
    <div className="flex gap-4 overflow-x-auto p-6">
      {columns.map((column) => (
        <BoardColumn
          key={column.id}
          columnId={column.id}
          title={column.name}
          cards={cardsByColumnId.get(column.id) ?? []}
          onAddCard={(input) => handleAddCard(column.id, input)}
          onUpdateCard={(cardId, input) => handleUpdateCard(column.id, cardId, input)}
          onDeleteCard={(cardId) => handleDeleteCard(column.id, cardId)}
          onMoveCard={handleMoveCard}
          onSortCards={handleSortCards}
          onRenameColumn={(name) => handleRenameColumn(column.id, name)}
          onDeleteColumn={() => handleDeleteColumn(column.id)}
          draggingCardId={draggingCardId}
          onDragStateChange={setDraggingCardId}
        />
      ))}
      <div className="w-72 flex-shrink-0">
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
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                disabled={addingColumn}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
            className="w-full rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
          >
            + カラム追加
          </button>
        )}
      </div>
    </div>
  )
}
