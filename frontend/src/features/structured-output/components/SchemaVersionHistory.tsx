import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import * as ScrollArea from '@radix-ui/react-scroll-area'

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
}

export function SchemaVersionHistory({ schemaName, className = '' }: Props) {
    const [versions, setVersions] = useState<SchemaVersion[]>([])
    const [error, setError] = useState<string>('')

    useEffect(() => {
        const fetchVersions = async () => {
            if (!schemaName) {
                setVersions([])
                return
            }

            try {
                const response = await fetch(`http://localhost:8000/schemas/${schemaName}/versions`)
                if (!response.ok) throw new Error('Failed to fetch schema versions')
                const data = await response.json()
                setVersions(data)
            } catch (err) {
                setError('Failed to load schema versions')
                console.error('Error fetching schema versions:', err)
            }
        }

        fetchVersions()
    }, [schemaName])

    if (!schemaName) return null

    return (
        <Card className={`bg-card ${className}`}>
            <CardHeader className="border-b border-border">
                <CardTitle className="text-sm">Schema Version History</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <ScrollArea.Root className="h-[400px] pr-4">
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
                                                {new Date(version.created_at).toLocaleString()}
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
                </ScrollArea.Root>
            </CardContent>
        </Card>
    )
} 