import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown, ChevronRight, Copy, Check, Star, Loader2, Trash2 } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Generation {
    id: number
    schema_name: string
    schema_version: number
    prompt: string
    output: any
    created_at: string
    is_favorite: boolean
}

interface GenerationHistoryProps {
    schemaName: string | null
    updateTrigger?: number  // timestamp of last generation
}

const formatTimestamp = (isoString: string) => {
    const date = parseISO(isoString)
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return {
        relative: formatDistanceToNow(localDate, {
            addSuffix: true,
            includeSeconds: true
        }),
        time: localDate.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }
}

export function GenerationHistory({ schemaName, updateTrigger }: GenerationHistoryProps) {
    const [generations, setGenerations] = useState<Generation[]>([])
    const [error, setError] = useState<string>('')
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [isOpen, setIsOpen] = useState(true)
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const [generationToDelete, setGenerationToDelete] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

    const fetchGenerations = async () => {
        if (!schemaName) {
            setGenerations([])
            return
        }
        try {
            const response = await fetch(
                `http://localhost:8000/generations/${schemaName}`
            )
            if (!response.ok) throw new Error('Failed to fetch generations')
            const data = await response.json()
            setGenerations(data)
            setSelectedId(data[0]?.id ?? null)
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

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        setGenerationToDelete(id)
    }

    const confirmDelete = async () => {
        if (!generationToDelete) return

        setIsDeleting(true)
        try {
            const response = await fetch(`http://localhost:8000/generations/${generationToDelete}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete generation')

            // Remove from local state
            setGenerations(prev => prev.filter(gen => gen.id !== generationToDelete))
            if (selectedId === generationToDelete) {
                setSelectedId(null)
            }
        } catch (err) {
            console.error('Error deleting generation:', err)
        } finally {
            setIsDeleting(false)
            setGenerationToDelete(null)
        }
    }

    const filteredGenerations = showFavoritesOnly
        ? generations.filter(gen => gen.is_favorite)
        : generations

    const toggleFavorite = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        try {
            const response = await fetch(`http://localhost:8000/generations/${id}/favorite`, {
                method: 'PUT',
            })
            if (!response.ok) throw new Error('Failed to update generation')

            const updatedGeneration = await response.json()
            setGenerations(prev =>
                prev.map(g => g.id === id ? updatedGeneration : g)
            )
        } catch (err) {
            console.error('Error updating generation:', err)
        }
    }

    if (!schemaName) return null

    return (
        <>
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
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs ${showFavoritesOnly ? 'bg-muted' : ''}`}
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    >
                        {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
                    </Button>
                </CardHeader>
                <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
                    <Collapsible.Content>
                        <CardContent className="px-4 py-4">
                            {error ? (
                                <div className="text-sm text-destructive font-medium">{error}</div>
                            ) : filteredGenerations.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    {showFavoritesOnly ? 'No favorite generations yet' : 'No generations yet'}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredGenerations.map((gen) => (
                                        <div
                                            key={gen.id}
                                            className={`
                                                group relative
                                                text-sm rounded-md p-2 cursor-pointer transition-colors border
                                                ${selectedId === gen.id
                                                    ? 'bg-muted border-muted-foreground/20'
                                                    : 'hover:bg-muted/50 border-transparent'}
                                            `}
                                            onClick={() => setSelectedId(gen.id)}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="text-[11px] text-muted-foreground/70 flex flex-col">
                                                        <span>{formatTimestamp(gen.created_at).relative}</span>
                                                        <span className="text-muted-foreground/50">
                                                            {formatTimestamp(gen.created_at).time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={(e) => toggleFavorite(e, gen.id)}
                                                    >
                                                        <Star
                                                            className={`h-4 w-4 ${gen.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''
                                                                }`}
                                                        />
                                                    </Button>
                                                    <div className="text-[11px] font-mono text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                                        v{gen.schema_version}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="line-clamp-2">
                                                {gen.prompt}
                                            </div>
                                            {selectedId === gen.id && (
                                                <div className="mt-2 relative group">
                                                    <pre className="text-xs bg-muted rounded-md p-2 overflow-auto border">
                                                        {JSON.stringify(gen.output, null, 2)}
                                                    </pre>
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute bottom-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/50 hover:text-destructive"
                                                        onClick={(e) => handleDelete(e, gen.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
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

            <AlertDialog
                open={generationToDelete !== null}
                onOpenChange={() => setGenerationToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Generation</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this generation?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
} 