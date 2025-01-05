import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Schemas } from './types'
import { SchemaSelector } from './components/SchemaSelector'
import { InputSection } from './components/InputSection'
import { OutputDisplay } from './components/OutputDisplay'
import { HistoryPanel } from './components/HistoryPanel'
import { ErrorDisplay } from './components/ErrorDisplay'
import { API_URL } from '@/config'
import { cn } from '@/lib/utils'

interface Props {
    className?: string
}

export function StructuredOutputGenerator({ className = '' }: Props) {
    const [input, setInput] = useState('')
    const [response, setResponse] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSchema, setSelectedSchema] = useState<string>('')
    const [schemas, setSchemas] = useState<Schemas>({})
    const [error, setError] = useState<{
        type: 'validation_error' | 'not_found' | 'generation_error' | 'database_error' | 'schema_error'
        message: string
        details?: Record<string, any>
    } | null>(null)
    const [hasGenerations, setHasGenerations] = useState(false)
    const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
    const [updateTrigger, setUpdateTrigger] = useState<number>(0)

    useEffect(() => {
        const fetchSchemas = async () => {
            try {
                const response = await fetch(`${API_URL}/schemas`)
                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.message)
                }
                const data = await response.json()
                setSchemas(data)
            } catch (err) {
                setError({
                    type: 'schema_error',
                    message: 'Failed to load schemas. Is the backend running?',
                    details: err instanceof Error ? { error: err.message } : undefined
                })
                console.error('Error fetching schemas:', err)
            }
        }

        fetchSchemas()
    }, [])

    useEffect(() => {
        const handleSchemaSelect = (e: CustomEvent<string>) => {
            setSelectedSchema(e.detail)
            setInput('')
            setResponse('')
        }

        window.addEventListener('select-schema', handleSchemaSelect as EventListener)
        return () => window.removeEventListener('select-schema', handleSchemaSelect as EventListener)
    }, [])

    useEffect(() => {
        const checkGenerations = async () => {
            if (!selectedSchema) {
                setHasGenerations(false)
                return
            }
            try {
                const response = await fetch(`${API_URL}/generations/${selectedSchema}`)
                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.message)
                }
                const data = await response.json()
                setHasGenerations(data.length > 0)
            } catch (err) {
                console.error('Error checking generations:', err)
                setHasGenerations(false)
            }
        }

        checkGenerations()
    }, [selectedSchema, response])

    const handleSubmit = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_URL}/generate/${selectedSchema}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: input }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw {
                    type: data.type || 'generation_error',
                    message: data.message || 'Failed to generate output',
                    details: data.details
                }
            }

            setResponse(JSON.stringify(data, null, 2))
            setLastGenerationTime(Date.now())
            setUpdateTrigger(Date.now())

            if (selectedSchema === 'NewSchema') {
                const schemasResponse = await fetch(`${API_URL}/schemas`)
                if (!schemasResponse.ok) {
                    const error = await schemasResponse.json()
                    throw new Error(error.message)
                }
                const schemas = await schemasResponse.json()
                setSchemas(schemas)
                setUpdateTrigger(Date.now())
            }
        } catch (err: unknown) {
            if (typeof err === 'object' && err !== null && 'type' in err) {
                setError(err as {
                    type: 'validation_error' | 'not_found' | 'generation_error' | 'database_error' | 'schema_error'
                    message: string
                    details?: Record<string, any>
                })
            } else {
                setError({
                    type: 'generation_error',
                    message: err instanceof Error ? err.message : 'Failed to generate output',
                    details: err instanceof Error ? { error: err.message } : undefined
                })
            }
            console.error('Error generating output:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSchemaSelect = (value: string) => {
        setSelectedSchema(value)
        setInput('')
        setResponse('')
        setUpdateTrigger(Date.now())
    }

    const handleSchemaDelete = async (schemaName: string) => {
        try {
            const response = await fetch(`${API_URL}/schemas/${schemaName}`, {
                method: 'DELETE',
            })
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.detail || 'Failed to delete schema')
            }

            const schemasResponse = await fetch(`${API_URL}/schemas`)
            if (!schemasResponse.ok) throw new Error('Failed to fetch schemas')
            const data = await schemasResponse.json()
            setSchemas(data)

            // Clear selected schema if it was the one deleted
            if (selectedSchema === schemaName) {
                setSelectedSchema('')
                setInput('')
                setResponse('')
            }
            setUpdateTrigger(Date.now())
        } catch (err) {
            setError({
                type: 'schema_error',
                message: 'Failed to delete schema',
                details: err instanceof Error ? { error: err.message } : undefined
            })
            console.error('Error deleting schema:', err)
        }
    }

    const handleSchemaEdit = async (schemaName: string, prompt: string) => {
        try {
            const response = await fetch(`${API_URL}/schemas/${schemaName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            })
            if (!response.ok) throw new Error('Failed to update schema')

            const schemasResponse = await fetch(`${API_URL}/schemas`)
            if (!schemasResponse.ok) throw new Error('Failed to fetch schemas')
            const data = await schemasResponse.json()
            setSchemas(data)

            setUpdateTrigger(Date.now())
        } catch (err) {
            setError({
                type: 'schema_error',
                message: 'Failed to update schema',
                details: err instanceof Error ? { error: err.message } : undefined
            })
            console.error('Error updating schema:', err)
            throw err
        }
    }

    const mainContent = (
        <Card className={cn("bg-card w-full", className)}>
            <CardHeader className="border-b border-border px-4 py-3 md:px-6 md:py-4">
                <CardTitle className="text-lg md:text-xl">Structured Output Generator</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-4 md:space-y-6 p-4 md:p-6">
                {error ? (
                    <ErrorDisplay error={error} onDismiss={() => setError(null)} />
                ) : (
                    <div className="flex flex-col space-y-4 md:space-y-6">
                        <div className="schema-selector">
                            <SchemaSelector
                                schemas={schemas}
                                selectedSchema={selectedSchema}
                                onSchemaSelect={handleSchemaSelect}
                                onSchemaDelete={handleSchemaDelete}
                                onSchemaEdit={handleSchemaEdit}
                            />
                        </div>
                        <div className="input-section">
                            <InputSection
                                input={input}
                                selectedSchema={selectedSchema}
                                schemas={schemas}
                                isLoading={isLoading}
                                onInputChange={setInput}
                                onSubmit={handleSubmit}
                            />
                        </div>
                        {response && (
                            <div className="output-section">
                                <OutputDisplay
                                    response={response}
                                    schema={selectedSchema ? schemas[selectedSchema] : undefined}
                                />
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className={`min-h-screen flex items-start md:items-center justify-center p-4 md:p-12 ${className}`}>
            <div className="w-full max-w-[95vw] md:max-w-[1400px]">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)] gap-4 md:gap-8">
                    <div className="min-w-0 w-full">
                        {mainContent}
                    </div>
                    <div className="min-w-0 w-full">
                        <HistoryPanel
                            schemaName={selectedSchema || null}
                            updateTrigger={updateTrigger}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
} 