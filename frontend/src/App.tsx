import { Board } from './components/Board'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">タスク管理ボード</h1>
      </header>
      <Board />
    </div>
  )
}

export default App
