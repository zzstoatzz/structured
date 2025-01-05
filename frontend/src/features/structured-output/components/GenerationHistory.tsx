import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Generation {
    id: number
    schema_name: string
    prompt: string
    output: any
    created_at: string
}

interface GenerationHistoryProps {
    schemaName: string | null
    updateTrigger?: number  // timestamp of last generation
}

export function GenerationHistory({ schemaName, updateTrigger }: GenerationHistoryProps) {
    const [generations, setGenerations] = useState<Generation[]>([])
    const [error, setError] = useState<string>('')
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [isOpen, setIsOpen] = useState(true)
    const [copiedId, setCopiedId] = useState<number | null>(null)

    const fetchGenerations = async () => {
        if (!schemaName) {
            setGenerations([])
            return
        }
        try {
            const response = await fetch(`http://localhost:8000/generations/${schemaName}`)
            if (!response.ok) throw new Error('Failed to fetch generations')
            const data = await response.json()
            const sortedData = data.sort((a: Generation, b: Generation) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            setGenerations(sortedData)

            // Only set selectedId if there's no current selection
            if (!selectedId) {
                setSelectedId(sortedData[0]?.id ?? null)
            }
        } catch (err) {
            setError('Failed to load generation history')
            console.error('Error fetching generations:', err)
        }
    }

    // Reset and fetch when schema changes
    useEffect(() => {
        setSelectedId(null)
        setGenerations([])
        fetchGenerations()
    }, [schemaName])

    // Fetch when updateTrigger changes
    useEffect(() => {
        if (updateTrigger) {
            fetchGenerations()
        }
    }, [updateTrigger])

    const handleCopy = async (output: any, id: number) => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(output, null, 2))
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const renderCompactOutput = (output: any) => {
        if (typeof output !== 'object' || output === null) {
            return String(output)
        }

        const entries = Object.entries(output)
        const preview = entries.slice(0, 2).map(([key, value]) => {
            const valuePreview = typeof value === 'string' ? `"${value.slice(0, 15)}..."` : String(value)
            return `${key}: ${valuePreview}`
        }).join(', ')

        return entries.length > 2 ? `{ ${preview}, ... }` : `{ ${preview} }`
    }

    if (!schemaName) return null

    return (
        <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-x-4 pb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -ml-2 mr-1"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <CardTitle className="text-sm font-medium flex-1">Generation History</CardTitle>
            </CardHeader>
            <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
                <Collapsible.Content>
                    <CardContent className="px-4 py-4">
                        {error ? (
                            <div className="text-sm text-destructive font-medium">{error}</div>
                        ) : generations.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No generations yet</div>
                        ) : (
                            <div className="space-y-3">
                                {generations.map((gen) => (
                                    <div
                                        key={gen.id}
                                        className={`
                                            text-sm rounded-md p-2 cursor-pointer transition-colors border
                                            ${selectedId === gen.id
                                                ? 'bg-muted border-muted-foreground/20'
                                                : 'hover:bg-muted/50 border-transparent'}
                                        `}
                                        onClick={() => setSelectedId(gen.id)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="text-xs font-medium text-muted-foreground">
                                                {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                        <div className="line-clamp-2">
                                            {gen.prompt}
                                        </div>
                                        {selectedId === gen.id ? (
                                            <div className="mt-2 relative group">
                                                <pre className="text-xs bg-muted rounded-md p-2 overflow-auto border">
                                                    {JSON.stringify(gen.output, null, 2)}
                                                </pre>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCopy(gen.output, gen.id)
                                                    }}
                                                >
                                                    {copiedId === gen.id ? (
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-muted-foreground font-mono overflow-hidden text-ellipsis">
                                                {renderCompactOutput(gen.output)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Collapsible.Content>
            </Collapsible.Root>
        </Card>
    )
} 