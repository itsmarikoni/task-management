import { apiClient } from './client'
import type { Card } from '../types'

export interface CreateCardInput {
  columnId: number
  title: string
  description: string
  priority: string
  dueDate: string | null
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const { data } = await apiClient.post<Card>('/cards', input)
  return data
}

export interface UpdateCardInput {
  columnId: number
  title: string
  description: string
  priority: string
  dueDate: string | null
}

export async function updateCard(id: number, input: UpdateCardInput): Promise<Card> {
  const { data } = await apiClient.put<Card>(`/cards/${id}`, input)
  return data
}
