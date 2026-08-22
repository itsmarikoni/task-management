import { apiClient } from './client'
import type { Card, TaskFormInput } from '../types'

export interface CreateCardInput extends TaskFormInput {
  columnId: number
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const { data } = await apiClient.post<Card>('/cards', input)
  return data
}

export interface UpdateCardInput extends TaskFormInput {
  columnId: number
}

export async function updateCard(id: number, input: UpdateCardInput): Promise<Card> {
  const { data } = await apiClient.put<Card>(`/cards/${id}`, input)
  return data
}

export interface UpdateCardPositionInput {
  columnId: number
  afterCardId: number | null
}

export async function updateCardPosition(id: number, input: UpdateCardPositionInput): Promise<Card> {
  const { data } = await apiClient.patch<Card>(`/cards/${id}/position`, input)
  return data
}

export async function deleteCard(id: number): Promise<void> {
  await apiClient.delete(`/cards/${id}`)
}
