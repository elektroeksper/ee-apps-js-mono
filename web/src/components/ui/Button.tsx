import { cn } from '@/lib/utils'
import React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  children: React.ReactNode
}

export const buttonVariants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-indigo-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

export const buttonSizes = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base',
}

export function buttonClassNames(
  variant: keyof typeof buttonVariants = 'primary',
  size: keyof typeof buttonSizes = 'medium',
  disabled?: boolean,
  className?: string
) {
  return cn(
    'inline-flex items-center justify-center font-medium rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'transition-colors duration-200',
    buttonVariants[variant],
    buttonSizes[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  )
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) => {
  return (
    <button
      className={buttonClassNames(variant, size, disabled, className)}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
