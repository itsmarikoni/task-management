export type Priority = '高' | '中' | '低'

export interface Column {
  id: number
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface Card {
  id: number
  columnId: number
  title: string
  description: string
  priority: Priority
  dueDate: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface TaskFormInput {
  title: string
  description: string
  priority: Priority
  dueDate: string | null
}
