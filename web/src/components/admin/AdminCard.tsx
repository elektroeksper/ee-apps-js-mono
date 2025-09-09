'use client'

import { ReactNode } from 'react'
import { IconType } from 'react-icons'

interface IAdminCardProps {
  title: string
  value: string | number
  icon: IconType
  color?:
    | 'blue'
    | 'green'
    | 'purple'
    | 'orange'
    | 'indigo'
    | 'emerald'
    | 'red'
    | 'yellow'
  trend?: number
  description?: string
  loading?: boolean
  className?: string
  children?: ReactNode
}

export default function AdminCard({
  title,
  value,
  icon: IconComponent,
  color = 'blue',
  trend,
  description,
  loading = false,
  className = '',
  children,
}: IAdminCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <IconComponent className="h-6 w-6" />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center text-sm ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
          >
            <span className="font-medium">
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900">
          {loading ? (
            <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
          ) : typeof value === 'number' ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-slate-100">{children}</div>
      )}
    </div>
  )
}
