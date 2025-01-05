import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { type Schemas } from '../types'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface InputSectionProps {
    input: string
    selectedSchema: string
    schemas: Schemas
    isLoading: boolean
    onInputChange: (value: string) => void
    onSubmit: () => void
}

export function InputSection({
    input,
    selectedSchema,
    schemas,
    isLoading,
    onInputChange,
    onSubmit,
}: InputSectionProps) {
    const schema = selectedSchema ? schemas[selectedSchema] : null
    const placeholder = schema?.prompt || 'Select an output format above...'
    const isDisabled = !selectedSchema || !input.trim() || isLoading

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isDisabled) {
                e.preventDefault()
                onSubmit()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onSubmit, isDisabled])

    return (
        <div className="space-y-4">
            <Textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={placeholder}
                disabled={!selectedSchema || isLoading}
                className={`min-h-[120px] resize-none transition-opacity duration-200 ${isLoading ? 'opacity-50' : ''}`}
            />
            <Button
                onClick={onSubmit}
                disabled={isDisabled}
                className="w-full"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                    </div>
                ) : (
                    <span>Generate (⌘ + Enter)</span>
                )}
            </Button>
        </div>
    )
} 