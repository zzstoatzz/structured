import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface SchemaVersion {
    id: number
    version: number
    description: string
    prompt: string
    fields: Record<string, any>
    parent_version_id: number | null
    created_at: string
}

interface Props {
    schemaName: string | null
    className?: string
    updateTrigger?: number
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

export function SchemaVersionHistory({ schemaName, className = '', updateTrigger }: Props) {
    const [versions, setVersions] = useState<SchemaVersion[]>([])
    const [error, setError] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    const fetchVersions = async () => {
        if (!schemaName) {
            setVersions([])
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/schemas/${schemaName}/versions`)
            if (!response.ok) throw new Error('Failed to fetch schema versions')
            const data = await response.json()
            setVersions(data)
        } catch (err) {
            setError('Failed to load schema versions')
            console.error('Error fetching schema versions:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchVersions()
    }, [schemaName, updateTrigger])

    if (!schemaName) return null

    return (
        <Card className={`bg-card ${className}`}>
            <CardHeader className="border-b border-border">
                <CardTitle className="text-sm flex items-center justify-between">
                    <span>Schema Version History</span>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea.Root className="h-[200px]">
                    <ScrollArea.Viewport className="h-full p-4">
                        {error ? (
                            <div className="text-sm text-destructive">{error}</div>
                        ) : (
                            <div className="space-y-4">
                                {versions.map((version) => (
                                    <div
                                        key={version.id}
                                        className="relative pl-4 border-l-2 border-border"
                                    >
                                        <div className="absolute -left-1.5 top-2 h-3 w-3 rounded-full bg-primary" />
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    Version {version.version}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimestamp(version.created_at).relative}
                                                    <span className="ml-2 text-muted-foreground/50">
                                                        {formatTimestamp(version.created_at).time}
                                                    </span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {version.description}
                                            </p>
                                            <div className="text-xs text-muted-foreground">
                                                Prompt: {version.prompt}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                        className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out hover:bg-zinc-800/10"
                        orientation="vertical"
                    >
                        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-zinc-800/50" />
                    </ScrollArea.Scrollbar>
                </ScrollArea.Root>
            </CardContent>
        </Card>
    )
} 