import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Schemas } from '../types'

interface SchemaSelectorProps {
    schemas: Schemas
    selectedSchema: string
    onSchemaSelect: (value: string) => void
}

export function SchemaSelector({ schemas, selectedSchema, onSchemaSelect }: SchemaSelectorProps) {
    return (
        <Select onValueChange={onSchemaSelect} value={selectedSchema}>
            <SelectTrigger className="w-full bg-earth-50 border-earth-200">
                <SelectValue placeholder="Select output format..." />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(schemas).map(([name, schema]) => (
                    <SelectItem key={name} value={name}>
                        <div className="flex flex-col w-full">
                            <span className="font-medium">{schema.title}</span>
                            <span className="text-xs text-earth-500/80">{schema.description}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
} 