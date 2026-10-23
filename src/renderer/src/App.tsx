import { Button } from '@heroui/react'

function App(): React.JSX.Element {
  return (
    <main className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Art Todo</h1>
      <Button>Começar</Button>
    </main>
  )
}

export default App
