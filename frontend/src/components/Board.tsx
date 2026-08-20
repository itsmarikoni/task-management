import { useEffect, useState } from 'react'
import type { Card, Column } from '../types'
import { getCardsByColumn, getColumns, sortCardsByColumn } from '../api/columns'
import type { CardSortKey } from '../api/columns'
import { createCard, deleteCard, updateCard, updateCardPosition } from '../api/cards'
import { BoardColumn } from './BoardColumn'

const FIXED_COLUMNS = ['未着手', '進行中', '完了']

function resolveFixedColumns(columns: Column[]): (Column | undefined)[] {
  const sorted = [...columns].sort((a, b) => a.displayOrder - b.displayOrder)
  const byName = new Map(sorted.map((column) => [column.name, column]))

  const allMatch = FIXED_COLUMNS.every((name) => byName.has(name))
  if (allMatch) {
    return FIXED_COLUMNS.map((name) => byName.get(name))
  }

  return FIXED_COLUMNS.map((_, index) => sorted[index])
}

export function Board() {
  const [columns, setColumns] = useState<(Column | undefined)[]>([])
  const [cardsByColumnId, setCardsByColumnId] = useState<Map<number, Card[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggingCardId, setDraggingCardId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const allColumns = await getColumns()
        const resolved = resolveFixedColumns(allColumns)

        const entries = await Promise.all(
          resolved
            .filter((column): column is Column => column !== undefined)
            .map(async (column) => [column.id, await getCardsByColumn(column.id)] as const),
        )

        if (!cancelled) {
          setColumns(resolved)
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

  return (
    <div className="flex gap-4 overflow-x-auto p-6">
      {FIXED_COLUMNS.map((label, index) => {
        const column = columns[index]
        const cards = column ? (cardsByColumnId.get(column.id) ?? []) : []
        return (
          <BoardColumn
            key={label}
            columnId={column?.id}
            title={label}
            cards={cards}
            onAddCard={column ? (input) => handleAddCard(column.id, input) : undefined}
            onUpdateCard={column ? (cardId, input) => handleUpdateCard(column.id, cardId, input) : undefined}
            onDeleteCard={column ? (cardId) => handleDeleteCard(column.id, cardId) : undefined}
            onMoveCard={column ? handleMoveCard : undefined}
            onSortCards={column ? handleSortCards : undefined}
            draggingCardId={draggingCardId}
            onDragStateChange={setDraggingCardId}
          />
        )
      })}
    </div>
  )
}
