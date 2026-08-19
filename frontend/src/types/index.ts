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
  priority: string
  dueDate: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}
