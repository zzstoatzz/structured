import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check, Copy, Code, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface OutputDisplayProps {
    response: string
    schema?: any
}

export function OutputDisplay({ response, schema }: OutputDisplayProps) {
    const [copied, setCopied] = useState(false)
    const [formData, setFormData] = useState<any>(null)

    // Update form data whenever response changes
    useEffect(() => {
        if (response) {
            try {
                setFormData(JSON.parse(response))
            } catch (e) {
                console.error('Failed to parse response:', e)
            }
        }
    }, [response])

    if (!response || !formData) return null

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(formData, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const updateFormData = (key: string, value: any, path: string[] = []) => {
        setFormData((prev: any) => {
            const newData = { ...prev }
            let current = newData

            // Navigate to the correct nesting level
            for (let i = 0; i < path.length; i++) {
                current = current[path[i]]
            }

            current[key] = value
            return newData
        })
    }

    const renderFormField = (key: string, value: any, path: string[] = []) => {
        if (Array.isArray(value)) {
            return (
                <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</Label>
                    {value.map((item, index) => (
                        <Input
                            key={`${key}-${index}`}
                            value={item}
                            className="bg-background"
                            onChange={(e) => {
                                const newArray = [...value]
                                newArray[index] = e.target.value
                                updateFormData(key, newArray, path)
                            }}
                        />
                    ))}
                </div>
            )
        }

        if (typeof value === 'object' && value !== null) {
            return (
                <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</Label>
                    <div className="pl-4 border-l border-earth-200">
                        {Object.entries(value).map(([k, v]) =>
                            renderFormField(k, v, [...path, key])
                        )}
                    </div>
                </div>
            )
        }

        return (
            <div key={key} className="space-y-2">
                <Label className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</Label>
                <Input
                    value={value?.toString() ?? ''}
                    className="bg-background"
                    onChange={(e) => updateFormData(key, e.target.value, path)}
                />
            </div>
        )
    }

    return (
        <Card className="bg-earth-50 border-earth-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-6">
                <div className="flex items-center w-full">
                    <Tabs defaultValue="form" className="flex-1">
                        <div className="flex items-center justify-between w-full">
                            <TabsList className="grid w-[200px] grid-cols-2">
                                <TabsTrigger value="form" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Form
                                </TabsTrigger>
                                <TabsTrigger value="json" className="flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    JSON
                                </TabsTrigger>
                            </TabsList>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={copyToClipboard}
                            >
                                {copied ? <Check className="h-4 w-4 text-earth-600" /> : <Copy className="h-4 w-4 text-earth-400" />}
                            </Button>
                        </div>
                        <CardContent className="pt-2">
                            <TabsContent value="form" className="space-y-4 mt-0">
                                {formData && Object.entries(formData).map(([key, value]) =>
                                    renderFormField(key, value)
                                )}
                            </TabsContent>
                            <TabsContent value="json" className="mt-0">
                                <pre className="whitespace-pre-wrap font-mono text-sm text-earth-800 bg-background rounded-md p-4">
                                    {JSON.stringify(formData, null, 2)}
                                </pre>
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </div>
            </CardHeader>
        </Card>
    )
} 