import { apiClient } from './client'
import type { Card, Column } from '../types'

export async function getColumns(): Promise<Column[]> {
  const { data } = await apiClient.get<Column[]>('/columns')
  return data
}

export async function getCardsByColumn(columnId: number): Promise<Card[]> {
  const { data } = await apiClient.get<Card[]>(`/columns/${columnId}/cards`)
  return data
}

export type CardSortKey = 'PRIORITY' | 'DUE_DATE'

export async function sortCardsByColumn(columnId: number, sortKey: CardSortKey): Promise<Card[]> {
  const { data } = await apiClient.patch<Card[]>(`/columns/${columnId}/cards/sort`, { sortKey })
  return data
}

export async function createColumn(name: string): Promise<Column> {
  const { data } = await apiClient.post<Column>('/columns', { name })
  return data
}

export async function updateColumn(columnId: number, name: string): Promise<Column> {
  const { data } = await apiClient.put<Column>(`/columns/${columnId}`, { name })
  return data
}

export async function deleteColumn(columnId: number): Promise<void> {
  await apiClient.delete(`/columns/${columnId}`)
}
