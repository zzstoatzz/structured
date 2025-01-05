import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check, Copy, Code, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Schema } from '../types'

interface OutputDisplayProps {
    response: string
    schema?: Schema
}

export function OutputDisplay({ response, schema }: OutputDisplayProps) {
    const [copied, setCopied] = useState(false)
    const [formData, setFormData] = useState<any>(null)

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

    const renderFormField = (key: string, value: any, path: string[] = []) => {
        if (Array.isArray(value)) {
            return (
                <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium capitalize text-zinc-200">{key.replace(/_/g, ' ')}</Label>
                    {value.map((item, index) => (
                        <Input
                            key={`${key}-${index}`}
                            value={item}
                            className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/30"
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
                    <Label className="text-sm font-medium capitalize text-zinc-200">{key.replace(/_/g, ' ')}</Label>
                    <div className="pl-4 border-l border-zinc-800">
                        {Object.entries(value).map(([k, v]) =>
                            renderFormField(k, v, [...path, key])
                        )}
                    </div>
                </div>
            )
        }

        return (
            <div key={key} className="space-y-2">
                <Label className="text-sm font-medium capitalize text-zinc-200">{key.replace(/_/g, ' ')}</Label>
                <Input
                    value={value?.toString() ?? ''}
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/30"
                    onChange={(e) => updateFormData(key, e.target.value, path)}
                />
            </div>
        )
    }

    const updateFormData = (key: string, value: any, path: string[] = []) => {
        setFormData((prev: any) => {
            const newData = { ...prev }
            let current = newData

            for (let i = 0; i < path.length; i++) {
                current = current[path[i]]
            }

            current[key] = value
            return newData
        })
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 w-full">
            <Tabs defaultValue="form" className="flex-1">
                <CardHeader className="flex flex-col gap-4 pb-2 pt-4 px-6 border-b border-zinc-800">
                    {schema?.description && (
                        <div className="text-sm text-zinc-400">
                            {schema.description}
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <TabsList className="grid w-[200px] grid-cols-2 bg-zinc-800">
                            <TabsTrigger
                                value="form"
                                className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                            >
                                <FileText className="h-4 w-4" />
                                Form
                            </TabsTrigger>
                            <TabsTrigger
                                value="json"
                                className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
                            >
                                <Code className="h-4 w-4" />
                                JSON
                            </TabsTrigger>
                        </TabsList>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            onClick={copyToClipboard}
                        >
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <TabsContent value="form" className="space-y-4 mt-0">
                        {formData && Object.entries(formData).map(([key, value]) =>
                            renderFormField(key, value)
                        )}
                    </TabsContent>
                    <TabsContent value="json" className="mt-0">
                        <div className="max-w-full">
                            <pre className="whitespace-pre font-mono text-sm text-zinc-100 bg-zinc-950 rounded-md p-4 border border-zinc-800 overflow-x-auto">
                                {JSON.stringify(formData, null, 2)}
                            </pre>
                        </div>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    )
} 