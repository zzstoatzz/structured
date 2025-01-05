import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { Star, History, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { formatDistanceToNow, parseISO, subMinutes } from 'date-fns'

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
                    const response = await fetch(`http://localhost:8000/generations/${schemaName}`)
                    if (response.ok) {
                        const data = await response.json()
                        setGenerations(data)
                        setSelectedId(data[0]?.id ?? null)
                    } else {
                        setGenerations([])
                    }
                } else {
                    const response = await fetch('http://localhost:8000/generations')
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
                `http://localhost:8000/generations/${id}/favorite`,
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

    const handleCopy = (e: React.MouseEvent, output: any, id: number) => {
        e.stopPropagation()
        navigator.clipboard.writeText(JSON.stringify(output, null, 2))
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const renderGenerationCard = (gen: Generation) => (
        <div
            key={gen.id}
            className="border rounded-lg p-3 bg-card cursor-pointer hover:bg-accent/50 transition-colors relative"
            onClick={() => setSelectedId(gen.id === selectedId ? null : gen.id)}
        >
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                    v{gen.schema_version}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={e => toggleFavorite(e, gen.id)}
                >
                    <Star className={`h-4 w-4 ${gen.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </Button>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(subMinutes(parseISO(gen.created_at), new Date().getTimezoneOffset()), { addSuffix: true })}
                </span>
                {selectedId === gen.id && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto"
                        onClick={e => handleCopy(e, gen.output, gen.id)}
                    >
                        {copiedId === gen.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>
            <div className="text-sm mt-2">
                {gen.prompt}
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono truncate">
                {JSON.stringify(gen.output)}
            </div>
            {selectedId === gen.id && (
                <div className="mt-2 max-w-full">
                    <pre className="p-2 text-xs border rounded bg-muted overflow-x-auto">
                        {JSON.stringify(gen.output, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )

    const filteredGenerations = showFavoritesOnly
        ? generations.filter(g => g.is_favorite)
        : generations

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                        <History className="h-5 w-5" />
                        Generation History
                        {schemaName && (
                            <span className="text-xs text-muted-foreground/70 font-normal ml-2">
                                • {schemaName}
                            </span>
                        )}
                    </div>
                    {schemaName && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={showFavoritesOnly ? 'bg-muted' : ''}
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        >
                            {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea.Root className="h-[calc(100vh-300px)]">
                    <ScrollArea.Viewport className="w-full">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            </div>
                        ) : schemaName ? (
                            !filteredGenerations.length ? (
                                <div className="py-8 text-center">
                                    <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <h3 className="font-semibold">
                                        {showFavoritesOnly ? 'No Favorites' : 'No Generations'}
                                    </h3>
                                </div>
                            ) : (
                                <div className="space-y-2 pr-4">
                                    {filteredGenerations.map(renderGenerationCard)}
                                </div>
                            )
                        ) : (
                            <div className="space-y-4 pr-4">
                                {Object.entries(allSchemaGenerations).map(([schema, gens]) => (
                                    <div key={schema} className="space-y-2">
                                        <h3 className="font-medium text-sm">{schema}</h3>
                                        {gens.slice(0, 3).map(renderGenerationCard)}
                                        {gens.length > 3 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-muted-foreground"
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
                                        <h3 className="font-semibold">No Generations</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Select a schema to start generating
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                        className="flex w-2.5 touch-none select-none bg-transparent"
                        orientation="vertical"
                    >
                        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-zinc-800/50" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>
            </CardContent>
        </Card>
    )
}