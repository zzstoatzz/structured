import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Schemas } from './types'
import { SchemaSelector } from './components/SchemaSelector'
import { InputSection } from './components/InputSection'
import { OutputDisplay } from './components/OutputDisplay'
import { HistoryPanel } from './components/HistoryPanel'

interface Props {
    className?: string
}

export function StructuredOutputGenerator({ className = '' }: Props) {
    const [input, setInput] = useState('')
    const [response, setResponse] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSchema, setSelectedSchema] = useState<string>('')
    const [schemas, setSchemas] = useState<Schemas>({})
    const [error, setError] = useState<string>('')
    const [hasGenerations, setHasGenerations] = useState(false)
    const [lastGenerationTime, setLastGenerationTime] = useState<number>(0)
    const [updateTrigger, setUpdateTrigger] = useState<number>(0)

    useEffect(() => {
        const fetchSchemas = async () => {
            try {
                const response = await fetch('http://localhost:8000/schemas')
                if (!response.ok) throw new Error('Failed to fetch schemas')
                const data = await response.json()
                setSchemas(data)
            } catch (err) {
                setError('Failed to load schemas. Is the backend running?')
                console.error('Error fetching schemas:', err)
            }
        }

        fetchSchemas()
    }, [])

    useEffect(() => {
        const checkGenerations = async () => {
            if (!selectedSchema) {
                setHasGenerations(false)
                return
            }
            try {
                const response = await fetch(`http://localhost:8000/generations/${selectedSchema}`)
                if (!response.ok) throw new Error('Failed to fetch generations')
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
        setError('')
        try {
            const response = await fetch(`http://localhost:8000/generate/${selectedSchema}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: input }),
            })

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`)
            }

            const data = await response.json()
            setResponse(JSON.stringify(data, null, 2))
            setLastGenerationTime(Date.now())

            if (selectedSchema === 'NewSchema') {
                const schemasResponse = await fetch('http://localhost:8000/schemas')
                if (schemasResponse.ok) {
                    const schemas = await schemasResponse.json()
                    setSchemas(schemas)
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate output')
            console.error('Error generating output:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSchemaSelect = (value: string) => {
        setSelectedSchema(value)
        setInput('')
        setResponse('')
    }

    const handleSchemaDelete = async (schemaName: string) => {
        try {
            const response = await fetch(`http://localhost:8000/schemas/${schemaName}`, {
                method: 'DELETE',
            })
            if (!response.ok) throw new Error('Failed to delete schema')

            const schemasResponse = await fetch('http://localhost:8000/schemas')
            if (!schemasResponse.ok) throw new Error('Failed to fetch schemas')
            const data = await schemasResponse.json()
            setSchemas(data)
        } catch (err) {
            setError('Failed to delete schema')
            console.error('Error deleting schema:', err)
        }
    }

    const handleSchemaEdit = async (schemaName: string, prompt: string) => {
        try {
            const response = await fetch(`http://localhost:8000/schemas/${schemaName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            })
            if (!response.ok) throw new Error('Failed to update schema')

            const schemasResponse = await fetch('http://localhost:8000/schemas')
            if (!schemasResponse.ok) throw new Error('Failed to fetch schemas')
            const data = await schemasResponse.json()
            setSchemas(data)

            setUpdateTrigger(Date.now())
        } catch (err) {
            setError('Failed to update schema')
            console.error('Error updating schema:', err)
            throw err
        }
    }

    const mainContent = (
        <Card className="bg-card">
            <CardHeader className="border-b border-border">
                <CardTitle>Structured Output Generator</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-8 p-8">
                {error ? (
                    <div className="text-sm bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-destructive" role="alert">
                        {error}
                    </div>
                ) : (
                    <div className="flex flex-col space-y-8">
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
        <div className={`min-h-screen flex items-center justify-center p-12 ${className}`}>
            <div className="w-[1400px] max-w-[95vw]">
                <div className="grid grid-cols-[minmax(0,_2fr),minmax(0,_1fr)] gap-8">
                    <div>
                        {mainContent}
                    </div>
                    <div className="min-w-0">
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