export interface Schema {
    title: string
    description: string
    prompt: string
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