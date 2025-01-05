import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Eye, Trash2, Loader2, X } from 'lucide-react'
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
import { useState, useEffect } from 'react'

interface SchemaSelectorProps {
    schemas: Schemas
    selectedSchema: string
    onSchemaSelect: (value: string) => void
    onSchemaDelete: (schemaName: string) => void
    onSchemaEdit: (schemaName: string, prompt: string) => Promise<void>
}

interface SchemaChange {
    description: string
    before: Record<string, any>
    after: Record<string, any>
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
    const [isEditing, setIsEditing] = useState(false)
    const [schemaChange, setSchemaChange] = useState<SchemaChange | null>(null)

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

    const handleEdit = async () => {
        if (inspectSchema && editPrompt.trim()) {
            setIsEditing(true)
            try {
                const beforeSchema = schemas[inspectSchema]
                await onSchemaEdit(inspectSchema, editPrompt)
                // Show change preview modal
                setSchemaChange({
                    description: editPrompt,
                    before: beforeSchema,
                    after: schemas[inspectSchema]
                })
                setEditPrompt('')
                setInspectSchema(null)
            } finally {
                setIsEditing(false)
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && inspectSchema && editPrompt.trim() && !isEditing) {
                e.preventDefault()
                handleEdit()
            }
            // Dismiss change preview on Escape
            if (e.key === 'Escape' && schemaChange) {
                setSchemaChange(null)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [inspectSchema, editPrompt, isEditing, schemaChange])

    // Auto-dismiss change preview after 5 seconds
    useEffect(() => {
        if (schemaChange) {
            const timer = setTimeout(() => setSchemaChange(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [schemaChange])

    return (
        <>
            <Select value={selectedSchema} onValueChange={onSchemaSelect}>
                <SelectTrigger className="w-full min-h-[3rem] md:min-h-[2.5rem]">
                    <SelectValue placeholder="Select an output format..." />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh] md:max-h-[40vh]">
                    {Object.entries(schemas).map(([name, schema]) => (
                        <div key={name} className="relative group">
                            <SelectItem
                                value={name}
                                className="py-3 md:py-2 pr-20 md:pr-16"
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-base md:text-sm">{schema.title}</span>
                                    <span className="text-sm md:text-xs text-muted-foreground">
                                        {schema.description}
                                    </span>
                                </div>
                            </SelectItem>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2 md:gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 md:h-6 md:w-6"
                                    onClick={(e) => handleInspect(e, name)}
                                >
                                    <Eye className="h-5 w-5 md:h-4 md:w-4" />
                                </Button>
                                {isCustomSchema(name) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 md:h-6 md:w-6"
                                        onClick={(e) => handleDelete(e, name)}
                                    >
                                        <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </SelectContent>
            </Select>

            <AlertDialog open={schemaToDelete !== null} onOpenChange={() => setSchemaToDelete(null)}>
                <AlertDialogContent className="w-[95vw] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Schema</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this schema? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <AlertDialogCancel className="sm:flex-1">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600 text-white sm:flex-1"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={inspectSchema !== null} onOpenChange={() => setInspectSchema(null)}>
                <AlertDialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg md:text-xl">
                            {inspectSchema && schemas[inspectSchema]?.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base md:text-sm">
                            {inspectSchema && schemas[inspectSchema]?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-6 md:space-y-4 py-4">
                        <div>
                            <h4 className="text-base md:text-sm font-medium mb-2">Prompt Template</h4>
                            <p className="text-base md:text-sm text-muted-foreground">{inspectSchema && schemas[inspectSchema]?.prompt}</p>
                        </div>
                        <div>
                            <h4 className="text-base md:text-sm font-medium mb-2">Fields</h4>
                            <div className="space-y-3 md:space-y-2">
                                {inspectSchema && Object.entries(schemas[inspectSchema]?.properties || {}).map(([fieldName, field]) => (
                                    <div key={fieldName} className="text-base md:text-sm">
                                        <span className="font-medium">{fieldName}</span>
                                        <span className="text-muted-foreground"> ({field.type})</span>
                                        <p className="text-sm md:text-xs text-muted-foreground mt-1">{field.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {inspectSchema && !schemas[inspectSchema]?.is_builtin ? (
                            <div className="pt-2">
                                <h4 className="text-base md:text-sm font-medium mb-2">Edit Schema</h4>
                                <div className="flex flex-col md:flex-row gap-2">
                                    <Input
                                        placeholder="Describe how to modify this schema..."
                                        value={editPrompt}
                                        onChange={(e) => setEditPrompt(e.target.value)}
                                        className="flex-1 min-h-[2.75rem] md:min-h-0 text-base md:text-sm"
                                        disabled={isEditing}
                                    />
                                    <Button
                                        onClick={handleEdit}
                                        disabled={!editPrompt.trim() || isEditing}
                                        className="min-h-[2.75rem] md:min-h-0"
                                    >
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
                                                <span className="text-base md:text-sm">Updating...</span>
                                            </div>
                                        ) : (
                                            <span className="text-base md:text-sm">Update (⌘ + Enter)</span>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-sm md:text-xs text-muted-foreground mt-2">
                                    Example: "Add a genre field" or "Remove name and age fields"
                                </p>
                            </div>
                        ) : inspectSchema && schemas[inspectSchema]?.is_builtin && (
                            <div className="pt-2">
                                <div className="rounded-md bg-muted p-4 md:p-3">
                                    <p className="text-base md:text-sm text-muted-foreground">
                                        This is a built-in schema and cannot be edited. You can create a new custom schema based on this one by selecting "New Schema" and describing what you want.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="w-full sm:w-auto">Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Change Preview Modal */}
            <AlertDialog
                open={schemaChange !== null}
                onOpenChange={() => setSchemaChange(null)}
            >
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <div className="flex items-center justify-between">
                            <AlertDialogTitle>Schema Updated</AlertDialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setSchemaChange(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <AlertDialogDescription>
                            {schemaChange?.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div>
                            <h4 className="text-sm font-medium mb-2">Before</h4>
                            <pre className="text-xs bg-muted rounded-md p-2 overflow-auto border">
                                {schemaChange && JSON.stringify(schemaChange.before, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium mb-2">After</h4>
                            <pre className="text-xs bg-muted rounded-md p-2 overflow-auto border">
                                {schemaChange && JSON.stringify(schemaChange.after, null, 2)}
                            </pre>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
} 