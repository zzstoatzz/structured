import { GenerationHistory } from './GenerationHistory'
import { SchemaVersionHistory } from './SchemaVersionHistory'

interface HistoryPanelProps {
    schemaName: string | null
    updateTrigger?: number
    className?: string
}

export function HistoryPanel({ schemaName, updateTrigger, className = '' }: HistoryPanelProps) {
    return (
        <div className="space-y-4">
            <SchemaVersionHistory
                schemaName={schemaName}
                updateTrigger={updateTrigger}
            />
            <GenerationHistory
                schemaName={schemaName}
                updateTrigger={updateTrigger}
            />
        </div>
    )
} 