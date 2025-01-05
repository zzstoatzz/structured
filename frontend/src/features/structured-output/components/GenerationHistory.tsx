import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { Star, History, Copy, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { formatDistanceToNow, parseISO, subMinutes } from 'date-fns'
import { API_URL } from '@/config'
import { cn } from '@/lib/utils'

interface Generation {
    id: number
    schema_name: string
    schema_version: number
    prompt: string
    output: any
    created_at: string
    is_favorite: boolean
}

interface Props {
    schemaName: string | null
    updateTrigger?: number
}

export function GenerationHistory({ schemaName, updateTrigger }: Props) {
    const [generations, setGenerations] = useState<Generation[]>([])
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const [allSchemaGenerations, setAllSchemaGenerations] = useState<Record<string, Generation[]>>({})
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchGenerations = async () => {
            setIsLoading(true)
            try {
                if (schemaName) {
                    const response = await fetch(`${API_URL}/generations/${schemaName}`)
                    if (response.ok) {
                        const data = await response.json()
                        setGenerations(data)
                        setSelectedId(data[0]?.id ?? null)
                    } else {
                        setGenerations([])
                    }
                } else {
                    const response = await fetch(`${API_URL}/generations`)
                    if (response.ok) {
                        const data = await response.json()
                        setAllSchemaGenerations(data)
                    }
                }
            } catch (err) {
                console.error('Error fetching generations:', err)
                setGenerations([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchGenerations()
    }, [schemaName, updateTrigger])

    const toggleFavorite = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        try {
            const res = await fetch(
                `${API_URL}/generations/${id}/favorite`,
                { method: 'PUT' }
            )
            if (res.ok) {
                const updated = await res.json()
                if (schemaName) {
                    setGenerations(prev => prev.map(g => g.id === id ? updated : g))
                } else {
                    setAllSchemaGenerations(prev => {
                        const newState = { ...prev }
                        Object.keys(newState).forEach(schema => {
                            newState[schema] = newState[schema].map(g => g.id === id ? updated : g)
                        })
                        return newState
                    })
                }
            }
        } catch (err) {
            console.error('Error toggling favorite:', err)
        }
    }

    const handleCopy = async (e: React.MouseEvent, output: any, id: number) => {
        e.stopPropagation()
        try {
            const text = JSON.stringify(output, null, 2)

            // Create a temporary textarea element
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)

            // Select and copy
            textarea.select()
            document.execCommand('copy')

            // Clean up
            document.body.removeChild(textarea)

            // Update UI
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error('Error copying to clipboard:', err)
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        try {
            const res = await fetch(
                `${API_URL}/generations/${id}`,
                { method: 'DELETE' }
            )
            if (res.ok) {
                if (schemaName) {
                    setGenerations(prev => prev.filter(g => g.id !== id))
                } else {
                    setAllSchemaGenerations(prev => {
                        const newState = { ...prev }
                        Object.keys(newState).forEach(schema => {
                            newState[schema] = newState[schema].filter(g => g.id !== id)
                        })
                        return newState
                    })
                }
                setSelectedId(null)
            }
        } catch (err) {
            console.error('Error deleting generation:', err)
        }
    }

    const renderGenerationCard = (gen: Generation) => (
        <div
            key={gen.id}
            className="border rounded-lg p-4 md:p-3 bg-card cursor-pointer hover:bg-accent/50 transition-colors relative min-w-0"
            onClick={() => setSelectedId(gen.id === selectedId ? null : gen.id)}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
                    v{gen.schema_version}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:h-6 md:w-6"
                    onClick={e => toggleFavorite(e, gen.id)}
                >
                    <Star className={`h-5 w-5 md:h-4 md:w-4 ${gen.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </Button>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(subMinutes(parseISO(gen.created_at), new Date().getTimezoneOffset()), { addSuffix: true })}
                </span>
            </div>
            <div className="text-sm mt-3 md:mt-2">
                {gen.prompt}
            </div>
            <div className="mt-3 md:mt-2 font-mono text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {JSON.stringify(gen.output)}
            </div>
            {selectedId === gen.id && (
                <>
                    <div className="mt-3 md:mt-2 w-full">
                        <ScrollArea.Root className="w-full">
                            <ScrollArea.Viewport className="w-full">
                                <pre className="p-3 md:p-2 text-xs border rounded bg-muted/50 overflow-x-auto">
                                    <code className="block font-mono whitespace-pre">
                                        {JSON.stringify(gen.output, null, 2)}
                                    </code>
                                </pre>
                            </ScrollArea.Viewport>
                            <ScrollArea.Scrollbar
                                className="flex select-none touch-none p-0.5 bg-transparent transition-colors ease-out hover:bg-accent/50"
                                orientation="horizontal"
                            >
                                <ScrollArea.Thumb className="flex-1 bg-border/50 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                            </ScrollArea.Scrollbar>
                        </ScrollArea.Root>
                    </div>
                    <div className="mt-3 md:mt-2 flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "transition-colors",
                                copiedId === gen.id
                                    ? "text-green-500 hover:text-green-600"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={e => handleCopy(e, gen.output, gen.id)}
                        >
                            {copiedId === gen.id ? (
                                <><Check className="h-4 w-4 mr-2" /> Copied!</>
                            ) : (
                                <><Copy className="h-4 w-4 mr-2" /> Copy JSON</>
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={e => handleDelete(e, gen.id)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                    </div>
                </>
            )}
        </div>
    )

    const filteredGenerations = showFavoritesOnly
        ? generations.filter(g => g.is_favorite)
        : generations

    return (
        <Card>
            <CardHeader className="px-4 py-3 md:p-6">
                <CardTitle className="flex flex-col md:flex-row justify-center md:items-center gap-3 md:gap-2">
                    <div className="flex gap-2 items-center justify-center">
                        <History className="h-5 w-5" />
                        <span>Generation History</span>
                        {schemaName && (
                            <span className="text-xs text-muted-foreground/70 ml-2">
                                • {schemaName}
                            </span>
                        )}
                    </div>
                    {schemaName && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "text-xs w-full md:w-auto",
                                showFavoritesOnly && "bg-muted/50"
                            )}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        >
                            {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea.Root className="h-[calc(100vh-350px)] md:h-[calc(100vh-300px)]">
                    <ScrollArea.Viewport className="w-full p-4 md:p-6 pt-0 md:pt-0">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="text-xs text-muted-foreground">Loading...</div>
                            </div>
                        ) : schemaName ? (
                            !filteredGenerations.length ? (
                                <div className="py-8 text-center">
                                    <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <h3 className="text-base mb-2">
                                        {showFavoritesOnly ? 'No Favorites' : 'No Generations'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {showFavoritesOnly ? 'Star some generations to add them to favorites' : 'Start generating to see history'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 md:space-y-2">
                                    {filteredGenerations.map(gen => (
                                        <div
                                            key={gen.id}
                                            className="border rounded-lg p-4 md:p-3 bg-card cursor-pointer hover:bg-accent/50 transition-colors relative min-w-0"
                                            onClick={() => setSelectedId(gen.id === selectedId ? null : gen.id)}
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
                                                    v{gen.schema_version}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 md:h-6 md:w-6"
                                                    onClick={e => toggleFavorite(e, gen.id)}
                                                >
                                                    <Star className={`h-5 w-5 md:h-4 md:w-4 ${gen.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                                </Button>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(subMinutes(parseISO(gen.created_at), new Date().getTimezoneOffset()), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="text-sm mt-3 md:mt-2">
                                                {gen.prompt}
                                            </div>
                                            <div className="mt-3 md:mt-2 font-mono text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                                {JSON.stringify(gen.output)}
                                            </div>
                                            {selectedId === gen.id && (
                                                <>
                                                    <div className="mt-3 md:mt-2 w-full">
                                                        <ScrollArea.Root className="w-full">
                                                            <ScrollArea.Viewport className="w-full">
                                                                <pre className="p-3 md:p-2 text-xs border rounded bg-muted/50 overflow-x-auto">
                                                                    <code className="block font-mono whitespace-pre">
                                                                        {JSON.stringify(gen.output, null, 2)}
                                                                    </code>
                                                                </pre>
                                                            </ScrollArea.Viewport>
                                                            <ScrollArea.Scrollbar
                                                                className="flex select-none touch-none p-0.5 bg-transparent transition-colors ease-out hover:bg-accent/50"
                                                                orientation="horizontal"
                                                            >
                                                                <ScrollArea.Thumb className="flex-1 bg-border/50 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                                                            </ScrollArea.Scrollbar>
                                                        </ScrollArea.Root>
                                                    </div>
                                                    <div className="mt-3 md:mt-2 flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className={cn(
                                                                "transition-colors",
                                                                copiedId === gen.id
                                                                    ? "text-green-500 hover:text-green-600"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            )}
                                                            onClick={e => handleCopy(e, gen.output, gen.id)}
                                                        >
                                                            {copiedId === gen.id ? (
                                                                <><Check className="h-4 w-4 mr-2" /> Copied!</>
                                                            ) : (
                                                                <><Copy className="h-4 w-4 mr-2" /> Copy JSON</>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600"
                                                            onClick={e => handleDelete(e, gen.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="space-y-6 md:space-y-4">
                                {Object.entries(allSchemaGenerations).map(([schema, gens]) => (
                                    <div key={schema} className="space-y-3 md:space-y-2">
                                        <h3 className="text-sm">{schema}</h3>
                                        {gens.slice(0, 3).map(renderGenerationCard)}
                                        {gens.length > 3 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs text-muted-foreground"
                                                onClick={() => window.dispatchEvent(new CustomEvent('select-schema', { detail: schema }))}
                                            >
                                                View {gens.length - 3} more generations...
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {Object.keys(allSchemaGenerations).length === 0 && (
                                    <div className="py-8 text-center">
                                        <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                        <h3 className="text-base mb-2">No Generations</h3>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Select a schema to start generating
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                        className="flex w-2.5 touch-none select-none bg-transparent transition-colors hover:bg-zinc-800/30"
                        orientation="vertical"
                    >
                        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-zinc-800/50" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>
            </CardContent>
        </Card>
    )
}