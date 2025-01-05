import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '@/lib/utils'

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' | 'warning' }
>(({ className, variant = 'default', ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(
            'relative w-full rounded-lg border p-4',
            {
                'bg-background text-foreground': variant === 'default',
                'border-destructive/50 text-destructive dark:border-destructive': variant === 'destructive',
                'border-warning/50 text-warning dark:border-warning': variant === 'warning',
            },
            className
        )}
        {...props}
    />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn('mb-1 font-medium leading-none tracking-tight', className)}
        {...props}
    />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('text-sm [&_p]:leading-relaxed', className)}
        {...props}
    />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription } 