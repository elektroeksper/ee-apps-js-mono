import { ISettingItem } from '@/shared-generated'
import { useState } from 'react'
import { FiCode, FiEyeOff } from 'react-icons/fi'

interface DebugPanelProps {
  settings?: ISettingItem[]
  isLoading: boolean
  error: any
}

export function DebugPanel({ settings, isLoading, error }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false)

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Toggle Debug Panel"
      >
        {isVisible ? (
          <FiEyeOff className="h-5 w-5" />
        ) : (
          <FiCode className="h-5 w-5" />
        )}
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center">
              <FiCode className="h-5 w-5 mr-2" />
              Debug Panel
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Loading State */}
            <div>
              <strong className="text-blue-400">Loading State:</strong>
              <div className="ml-2 text-gray-300">
                {isLoading ? '⏳ Loading...' : '✅ Loaded'}
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div>
                <strong className="text-red-400">Error:</strong>
                <div className="ml-2 text-red-300 break-words">
                  {error.message || JSON.stringify(error)}
                </div>
              </div>
            )}

            {/* Settings Data */}
            <div>
              <strong className="text-green-400">Settings Count:</strong>
              <div className="ml-2 text-gray-300">
                {settings ? settings.length : 0} items
              </div>
            </div>

            {/* Settings Details */}
            {settings && settings.length > 0 && (
              <div>
                <strong className="text-yellow-400">Settings Data:</strong>
                <div className="ml-2 mt-1 bg-gray-800 rounded p-2 max-h-48 overflow-auto">
                  <pre className="text-xs text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(
                      settings.map(s => ({
                        key: s.key,
                        value: s.value,
                        type: typeof s.value,
                        isActive: s.isActive,
                        updatedAt: s.updatedAt,
                      })),
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* Console Log Button */}
            <div>
              <button
                onClick={() => {
                  console.group('🔍 Settings Debug Info')
                  console.log('Settings:', settings)
                  console.log('Loading:', isLoading)
                  console.log('Error:', error)
                  console.log(
                    'Settings by key:',
                    settings?.reduce(
                      (acc, setting) => {
                        acc[setting.key] = setting.value
                        return acc
                      },
                      {} as Record<string, any>
                    )
                  )
                  console.groupEnd()
                }}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs transition-colors"
              >
                📋 Log to Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
