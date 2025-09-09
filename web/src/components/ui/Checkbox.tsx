import { cn } from '@/lib/utils'
import React from 'react'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <input
          type="checkbox"
          className={cn(
            'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5',
            error && 'border-red-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <div className="ml-2">
            <label className="block text-sm text-gray-900">{label}</label>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
