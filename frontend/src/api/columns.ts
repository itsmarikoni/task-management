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
