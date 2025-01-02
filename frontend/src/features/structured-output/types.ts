export interface JsonSchema {
    title: string
    description: string
    type: string
    properties: Record<string, any>
    required?: string[]
    prompt?: string
}

export interface Schemas {
    [key: string]: JsonSchema
} 