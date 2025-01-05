import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { History, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SchemaVersion {
    id: number
    version: number
    description: string
    prompt: string
    fields: any[]
    parent_version_id: number | null
    created_at: string
}

interface Props {
    schemaName: string | null
    updateTrigger?: number
}

export function SchemaVersionHistory({ schemaName, updateTrigger }: Props) {
    const [versions, setVersions] = useState<SchemaVersion[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchVersions = async () => {
            if (!schemaName) {
                setVersions([])
                return
            }

            setIsLoading(true)
            try {
                const response = await fetch(`http://localhost:8000/schemas/${schemaName}/versions`)
                if (!response.ok) {
                    if (response.status === 404) {
                        // Schema was deleted
                        setVersions([])
                        return
                    }
                    throw new Error('Failed to fetch schema versions')
                }
                const data = await response.json()
                setVersions(data)
            } catch (err) {
                console.error('Error fetching schema versions:', err)
                setVersions([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchVersions()
    }, [schemaName, updateTrigger])

    if (!schemaName) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Schema Versions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Schema Selected</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px]">
                            Select a schema to view its version history
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Schema Versions
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Version History</h3>
                        <p className="text-sm text-muted-foreground max-w-[200px]">
                            Edit the schema to create new versions
                        </p>
                    </div>
                ) : (
                    <ScrollArea.Root className="h-[200px] relative">
                        <ScrollArea.Viewport className="h-full w-full">
                            <div className="space-y-2 pr-4">
                                <div className="relative">
                                    <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-border/50" />
                                    {versions.map((version) => (
                                        <div
                                            key={version.id}
                                            className="rounded-lg bg-card/50 p-3 text-card-foreground relative pl-7"
                                        >
                                            <div className="absolute left-[5px] top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-blue-500/50" />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="font-medium">
                                                        Version {version.version}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground/70">
                                                        {new Date(version.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {version.description || 'Initial version'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea.Viewport>
                        <ScrollArea.Scrollbar
                            className="flex select-none touch-none p-0.5 bg-transparent transition-colors duration-150 ease-out hover:bg-zinc-800/10"
                            orientation="vertical"
                        >
                            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-zinc-800/50" />
                        </ScrollArea.Scrollbar>
                    </ScrollArea.Root>
                )}
            </CardContent>
        </Card>
    )
} 