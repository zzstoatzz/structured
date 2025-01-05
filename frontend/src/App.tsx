// frontend/src/App.tsx
import { StructuredOutputGenerator } from './features/structured-output/StructuredOutputGenerator'
import { ThemeToggle } from './components/theme-toggle'
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen w-screen bg-background">
      <ThemeToggle />
      <StructuredOutputGenerator />
    </div>
  )
}