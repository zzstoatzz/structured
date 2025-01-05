// frontend/src/App.tsx
import { StructuredOutputGenerator } from './features/structured-output/StructuredOutputGenerator'
import { ThemeToggle } from './components/theme-toggle'
import { updateFonts } from './styles/fonts'
import { useEffect } from 'react'
import './App.css'

export default function App() {
  useEffect(() => {
    updateFonts()
  }, [])

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      <ThemeToggle />
      <StructuredOutputGenerator />
    </div>
  )
}