import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type ErrorType = 'validation_error' | 'not_found' | 'generation_error' | 'database_error' | 'schema_error'

interface ErrorDetails {
    type: ErrorType
    message: string
    details?: Record<string, any>
}

interface Props {
    error: ErrorDetails
    onDismiss?: () => void
}

const ERROR_CONFIG = {
    validation_error: {
        icon: AlertTriangle,
        title: 'Invalid Input',
        variant: 'warning' as const
    },
    not_found: {
        icon: XCircle,
        title: 'Not Found',
        variant: 'default' as const
    },
    generation_error: {
        icon: AlertCircle,
        title: 'Generation Failed',
        variant: 'destructive' as const
    },
    database_error: {
        icon: AlertCircle,
        title: 'Database Error',
        variant: 'destructive' as const
    },
    schema_error: {
        icon: AlertTriangle,
        title: 'Schema Error',
        variant: 'warning' as const
    }
}

export function ErrorDisplay({ error, onDismiss }: Props) {
    const config = ERROR_CONFIG[error.type]

    return (
        <Alert variant={config.variant}>
            <config.icon className="h-4 w-4" />
            <AlertTitle className="ml-2">{config.title}</AlertTitle>
            <AlertDescription className="ml-2">
                {error.message}
                {error.details && (
                    <pre className="mt-2 text-xs bg-secondary/50 p-2 rounded">
                        {JSON.stringify(error.details, null, 2)}
                    </pre>
                )}
            </AlertDescription>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="absolute top-2 right-2 text-foreground/50 hover:text-foreground"
                >
                    <XCircle className="h-4 w-4" />
                </button>
            )}
        </Alert>
    )
} 