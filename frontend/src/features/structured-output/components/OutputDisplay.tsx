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
                <div key={key} className="space-y-3 md:space-y-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-base md:text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                        </Label>
                        {description && (
                            <span className="text-sm md:text-xs text-muted-foreground">{description}</span>
                        )}
                    </div>
                    <div className="space-y-3 md:space-y-2">
                        {value.map((item: any, index: number) => (
                            <div key={`${key}-${index}`} className="flex flex-col md:flex-row gap-2">
                                <Input
                                    value={item}
                                    className="flex-1 min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
                                    onChange={(e) => {
                                        const newArray = [...value]
                                        newArray[index] = e.target.value
                                        updateFormData(key, newArray, path)
                                    }}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
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
                            className="w-full mt-2 min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
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
                <div key={key} className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div className="space-y-1">
                        <Label className="text-base md:text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                        </Label>
                        {description && (
                            <div className="text-sm md:text-xs text-muted-foreground">{description}</div>
                        )}
                    </div>
                    <Switch.Root
                        checked={value}
                        onCheckedChange={(checked) => updateFormData(key, checked, path)}
                        className="w-12 h-7 md:w-10 md:h-6 bg-secondary rounded-full relative data-[state=checked]:bg-primary outline-none cursor-default"
                    >
                        <Switch.Thumb className="block w-6 h-6 md:w-5 md:h-5 bg-background rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px] md:data-[state=checked]:translate-x-[18px]" />
                    </Switch.Root>
                </div>
            )
        }

        if (typeof value === 'object' && value !== null) {
            return (
                <div key={key} className="space-y-3 md:space-y-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-base md:text-sm font-medium capitalize">
                            {key.replace(/_/g, ' ')}
                        </Label>
                        {description && (
                            <span className="text-sm md:text-xs text-muted-foreground">{description}</span>
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
            <div key={key} className="space-y-3 md:space-y-2">
                <div className="flex flex-col gap-1">
                    <Label className="text-base md:text-sm font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                    </Label>
                    {description && (
                        <span className="text-sm md:text-xs text-muted-foreground">{description}</span>
                    )}
                </div>
                {isLongText ? (
                    <Textarea
                        value={value?.toString() ?? ''}
                        onChange={(e) => updateFormData(key, e.target.value, path)}
                        className="min-h-[120px] text-base md:text-sm"
                    />
                ) : (
                    <Input
                        value={value?.toString() ?? ''}
                        type={fieldType === 'integer' || fieldType === 'number' ? 'number' : 'text'}
                        className="min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
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
                <CardHeader className="flex flex-col gap-4 pb-3 pt-4 px-4 md:px-6 border-b border-border">
                    {schema?.description && (
                        <div className="text-base md:text-sm text-muted-foreground">
                            {schema.description}
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2">
                        <TabsList className="grid w-full md:w-[200px] grid-cols-2">
                            <TabsTrigger
                                value="form"
                                className="flex items-center gap-2 min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
                            >
                                <FileText className="h-5 w-5 md:h-4 md:w-4" />
                                Form
                            </TabsTrigger>
                            <TabsTrigger
                                value="json"
                                className="flex items-center gap-2 min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
                            >
                                <Code className="h-5 w-5 md:h-4 md:w-4" />
                                JSON
                            </TabsTrigger>
                        </TabsList>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-10 w-10 md:h-8 md:w-8 p-0"
                            onClick={copyToClipboard}
                        >
                            {copied ?
                                <Check className="h-5 w-5 md:h-4 md:w-4 text-emerald-500" /> :
                                <Copy className="h-5 w-5 md:h-4 md:w-4" />
                            }
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <TabsContent value="form" className="px-4 md:px-6 py-4 space-y-6 md:space-y-4 mt-0">
                        {formData && Object.entries(formData).map(([key, value]) =>
                            renderFormField(key, value)
                        )}
                    </TabsContent>
                    <TabsContent value="json" className="mt-0">
                        <pre className="whitespace-pre font-mono text-base md:text-sm p-4 md:p-6 bg-muted/50 overflow-x-auto">
                            {JSON.stringify(formData, null, 2)}
                        </pre>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    )
} 