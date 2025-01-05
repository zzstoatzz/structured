import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check, Copy, Code, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Schema } from '../types'
import { Textarea } from '@/components/ui/textarea'
import * as Switch from '@radix-ui/react-switch'

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
        const fieldSchema = schema?.properties?.[key]
        const fieldType = fieldSchema?.type || typeof value
        const description = fieldSchema?.description

        if (fieldType === 'list' || Array.isArray(value)) {
            return (
                <div key={key} className="space-y-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                        </Label>
                        {description && (
                            <span className="text-xs text-muted-foreground">{description}</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        {value.map((item: any, index: number) => (
                            <div key={`${key}-${index}`} className="flex gap-2 items-center">
                                <Input
                                    value={item}
                                    className="flex-1"
                                    onChange={(e) => {
                                        const newArray = [...value]
                                        newArray[index] = e.target.value
                                        updateFormData(key, newArray, path)
                                    }}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newArray = value.filter((_: any, i: number) => i !== index)
                                        updateFormData(key, newArray, path)
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                                updateFormData(key, [...value, ''], path)
                            }}
                        >
                            Add Item
                        </Button>
                    </div>
                </div>
            )
        }

        if (fieldType === 'boolean' || typeof value === 'boolean') {
            return (
                <div key={key} className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Label className="text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                        </Label>
                        {description && (
                            <div className="text-xs text-muted-foreground">{description}</div>
                        )}
                    </div>
                    <Switch.Root
                        checked={value}
                        onCheckedChange={(checked) => updateFormData(key, checked, path)}
                        className="w-10 h-6 bg-secondary rounded-full relative data-[state=checked]:bg-primary outline-none cursor-default"
                    >
                        <Switch.Thumb className="block w-5 h-5 bg-background rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[18px]" />
                    </Switch.Root>
                </div>
            )
        }

        if (typeof value === 'object' && value !== null) {
            return (
                <div key={key} className="space-y-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                        </Label>
                        {description && (
                            <span className="text-xs text-muted-foreground">{description}</span>
                        )}
                    </div>
                    <div className="pl-4 border-l border-border space-y-4">
                        {Object.entries(value).map(([k, v]) =>
                            renderFormField(k, v, [...path, key])
                        )}
                    </div>
                </div>
            )
        }

        const isLongText = value?.toString().length > 100

        return (
            <div key={key} className="space-y-2">
                <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                    </Label>
                    {description && (
                        <span className="text-xs text-muted-foreground">{description}</span>
                    )}
                </div>
                {isLongText ? (
                    <Textarea
                        value={value?.toString() ?? ''}
                        onChange={(e) => updateFormData(key, e.target.value, path)}
                    />
                ) : (
                    <Input
                        value={value?.toString() ?? ''}
                        type={fieldType === 'integer' || fieldType === 'number' ? 'number' : 'text'}
                        onChange={(e) => {
                            let val = e.target.value
                            if (fieldType === 'integer') {
                                val = val.replace(/\D/g, '')
                            }
                            updateFormData(key, val, path)
                        }}
                    />
                )}
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
        <Card className="bg-card border-border">
            <Tabs defaultValue="form" className="flex-1">
                <CardHeader className="flex flex-col gap-4 pb-2 pt-4 px-6 border-b border-border">
                    {schema?.description && (
                        <div className="text-sm text-muted-foreground">
                            {schema.description}
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <TabsList className="grid w-[200px] grid-cols-2">
                            <TabsTrigger
                                value="form"
                                className="flex items-center gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Form
                            </TabsTrigger>
                            <TabsTrigger
                                value="json"
                                className="flex items-center gap-2"
                            >
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
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TabsContent value="form" className="px-6 py-4 space-y-4 mt-0">
                        {formData && Object.entries(formData).map(([key, value]) =>
                            renderFormField(key, value)
                        )}
                    </TabsContent>
                    <TabsContent value="json" className="mt-0">
                        <pre className="whitespace-pre font-mono text-sm p-6 bg-muted/50">
                            {JSON.stringify(formData, null, 2)}
                        </pre>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    )
} 