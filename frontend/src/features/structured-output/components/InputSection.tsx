import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { type Schemas } from '../types'

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
    onSubmit
}: InputSectionProps) {
    return (
        <div className="space-y-4">
            <Textarea
                placeholder={selectedSchema
                    ? schemas[selectedSchema].prompt ?? "Enter text to structure..."
                    : "Select an output format above..."}
                className="structured-output-textarea"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                disabled={!selectedSchema}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && input.trim() && selectedSchema && !isLoading) {
                        e.preventDefault()
                        onSubmit()
                    }
                }}
            />
            <Button
                className="structured-output-button"
                onClick={onSubmit}
                disabled={isLoading || !input.trim() || !selectedSchema}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : 'Generate (⌘ + Enter)'}
            </Button>
        </div>
    )
} 