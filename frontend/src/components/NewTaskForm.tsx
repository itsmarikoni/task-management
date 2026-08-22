import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Priority, TaskFormInput } from '../types'

interface NewTaskFormProps {
  onSubmit: (input: TaskFormInput) => Promise<void>
  onCancel: () => void
  initialValues?: TaskFormInput
  submitLabel?: string
  errorMessage?: string
}

const PRIORITIES: Priority[] = ['高', '中', '低']

export function NewTaskForm({
  onSubmit,
  onCancel,
  initialValues,
  submitLabel = '追加',
  errorMessage = 'タスクの登録に失敗しました。',
}: NewTaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initialValues?.priority ?? '中')
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      setError('タイトルを入力してください。')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
      })
    } catch {
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-2 flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-3">
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="タイトル"
        maxLength={100}
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="詳細（任意）"
        className="rounded border border-gray-300 px-2 py-1 text-sm"
        rows={2}
      />
      <div className="flex gap-2">
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
          disabled={submitting}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
