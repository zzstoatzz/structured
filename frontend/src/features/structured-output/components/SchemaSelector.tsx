import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { type Schemas } from '../types'

interface SchemaSelectorProps {
    schemas: Schemas
    selectedSchema: string
    onSchemaSelect: (value: string) => void
    onSchemaDelete?: (schemaName: string) => void
}

const BUILTIN_SCHEMAS = ['SQLQuery', 'ExecutiveSummary', 'NewSchema']

export function SchemaSelector({ schemas, selectedSchema, onSchemaSelect, onSchemaDelete }: SchemaSelectorProps) {
    const isCustomSchema = (schemaName: string) => {
        return !BUILTIN_SCHEMAS.includes(schemaName)
    }

    const handleDelete = (e: React.MouseEvent, schemaName: string) => {
        e.preventDefault()
        e.stopPropagation()
        onSchemaDelete?.(schemaName)
    }

    const renderTriggerContent = () => {
        if (!selectedSchema || !schemas[selectedSchema]) {
            return <SelectValue placeholder="Select output format..." />
        }
        const schema = schemas[selectedSchema]
        return (
            <span className="font-medium">{schema.title}</span>
        )
    }

    return (
        <Select onValueChange={onSchemaSelect} value={selectedSchema}>
            <SelectTrigger className="w-full bg-earth-50 border-earth-200">
                {renderTriggerContent()}
            </SelectTrigger>
            <SelectContent>
                {Object.entries(schemas).map(([name, schema]) => (
                    <div key={name} className="relative">
                        <SelectItem value={name} className="py-2 pr-10">
                            <div className="flex flex-col">
                                <span className="font-medium">{schema.title}</span>
                                <span className="text-xs text-earth-500/80">{schema.description}</span>
                            </div>
                        </SelectItem>
                        {isCustomSchema(name) && onSchemaDelete && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-red-100 hover:text-red-600 z-50"
                                onClick={(e) => handleDelete(e, name)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </SelectContent>
        </Select>
    )
} 