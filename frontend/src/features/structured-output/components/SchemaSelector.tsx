import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import { type Schemas } from '../types'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { useState } from 'react'

interface SchemaSelectorProps {
    schemas: Schemas
    selectedSchema: string
    onSchemaSelect: (value: string) => void
    onSchemaDelete: (schemaName: string) => void
    onSchemaEdit: (schemaName: string, prompt: string) => void
}

export function SchemaSelector({
    schemas,
    selectedSchema,
    onSchemaSelect,
    onSchemaDelete,
    onSchemaEdit,
}: SchemaSelectorProps) {
    const [schemaToDelete, setSchemaToDelete] = useState<string | null>(null)
    const [inspectSchema, setInspectSchema] = useState<string | null>(null)
    const [editPrompt, setEditPrompt] = useState('')

    const isCustomSchema = (schemaName: string) => {
        return !schemas[schemaName]?.is_builtin
    }

    const handleDelete = (e: React.MouseEvent, schemaName: string) => {
        e.preventDefault()
        e.stopPropagation()
        setSchemaToDelete(schemaName)
    }

    const handleInspect = (e: React.MouseEvent, schemaName: string) => {
        e.preventDefault()
        e.stopPropagation()
        setInspectSchema(schemaName)
        setEditPrompt('')
    }

    const confirmDelete = () => {
        if (schemaToDelete) {
            onSchemaDelete(schemaToDelete)
        }
        setSchemaToDelete(null)
    }

    const handleEdit = () => {
        if (inspectSchema && editPrompt.trim()) {
            onSchemaEdit(inspectSchema, editPrompt)
            setEditPrompt('')
        }
    }

    return (
        <>
            <Select value={selectedSchema} onValueChange={onSchemaSelect}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an output format..." />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(schemas).map(([name, schema]) => (
                        <div key={name} className="relative group">
                            <SelectItem
                                value={name}
                                className="py-2 pr-16"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{schema.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {schema.description}
                                    </span>
                                </div>
                            </SelectItem>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => handleInspect(e, name)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {isCustomSchema(name) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => handleDelete(e, name)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </SelectContent>
            </Select>

            <AlertDialog open={schemaToDelete !== null} onOpenChange={() => setSchemaToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schema</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this schema? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={inspectSchema !== null} onOpenChange={() => setInspectSchema(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {inspectSchema && schemas[inspectSchema]?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {inspectSchema && schemas[inspectSchema]?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Prompt Template</h4>
                            <p className="text-sm text-muted-foreground">{inspectSchema && schemas[inspectSchema]?.prompt}</p>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">Fields</h4>
                            <div className="space-y-2">
                                {inspectSchema && Object.entries(schemas[inspectSchema]?.properties || {}).map(([fieldName, field]) => (
                                    <div key={fieldName} className="text-sm">
                                        <span className="font-medium">{fieldName}</span>
                                        <span className="text-muted-foreground"> ({field.type})</span>
                                        <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {inspectSchema && !schemas[inspectSchema]?.is_builtin && (
                            <div className="pt-2">
                                <h4 className="text-sm font-medium mb-2">Edit Schema</h4>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Describe how to modify this schema..."
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleEdit}
                                        disabled={!editPrompt.trim()}
                                    >
                                        Update
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Example: "Add a genre field" or "Remove name and age fields"
                                </p>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
} 