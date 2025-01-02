import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Schemas } from './types'
import { SchemaSelector } from './components/SchemaSelector'
import { InputSection } from './components/InputSection'
import { OutputDisplay } from './components/OutputDisplay'

export function StructuredOutputGenerator() {
    const [input, setInput] = useState('')
    const [response, setResponse] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedSchema, setSelectedSchema] = useState<string>('')
    const [schemas, setSchemas] = useState<Schemas>({})
    const [error, setError] = useState<string>('')

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

            // Refresh schemas if we just created a new one
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

    return (
        <div className="structured-output-container">
            <div className="structured-output">
                <Card className="structured-output-card">
                    <CardHeader className="border-b border-earth-200">
                        <CardTitle className="text-earth-800 text-center">Structured Output Generator</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        {error ? (
                            <div className="text-red-500 text-sm">{error}</div>
                        ) : (
                            <>
                                <SchemaSelector
                                    schemas={schemas}
                                    selectedSchema={selectedSchema}
                                    onSchemaSelect={setSelectedSchema}
                                />
                                <InputSection
                                    input={input}
                                    selectedSchema={selectedSchema}
                                    schemas={schemas}
                                    isLoading={isLoading}
                                    onInputChange={setInput}
                                    onSubmit={handleSubmit}
                                />
                                <OutputDisplay
                                    response={response}
                                    schema={selectedSchema ? schemas[selectedSchema] : undefined}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 