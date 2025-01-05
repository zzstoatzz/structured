import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { theme, setTheme as setDocumentTheme, getSystemTheme } from '../lib/theme'

export function ThemeToggle() {
    const [theme, setTheme] = useState<theme>('system')

    useEffect(() => {
        // watch for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (theme === 'system') {
                setDocumentTheme('system')
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
        setTheme(newTheme)
        setDocumentTheme(newTheme)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="fixed top-4 right-4"
        >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
} 