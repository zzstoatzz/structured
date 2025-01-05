export interface Schema {
    title: string
    description: string
    prompt: string
    is_builtin: boolean
    properties: {
        [key: string]: {
            type: string
            description: string
        }
    }
}

export interface Schemas {
    [key: string]: Schema
} 