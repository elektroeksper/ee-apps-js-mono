import React, { useState } from 'react'
import { FiEdit3, FiEye, FiSave, FiX } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  height?: number
  className?: string
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Enter markdown content...',
  height = 300,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [previewMode, setPreviewMode] = useState(false)

  const handleSave = () => {
    onChange(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  React.useEffect(() => {
    setEditValue(value)
  }, [value])

  if (isEditing) {
    return (
      <div className={`space-y-4 ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
                  previewMode
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FiEye className="w-3 h-3" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <FiSave className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                <FiX className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden bg-white">
          {previewMode ? (
            <div
              className="p-4 prose prose-sm max-w-none overflow-y-auto"
              style={{ minHeight: `${height}px`, maxHeight: `${height}px` }}
            >
              <ReactMarkdown>{editValue || 'Nothing to preview'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-none font-mono text-sm"
              style={{ height: `${height}px` }}
            />
          )}
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p>
            <strong>Markdown syntax:</strong> Use **bold**, *italic*, # headers,
            - lists,
            {'>'}blockquotes, `code`, and [links](url)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <FiEdit3 className="w-3 h-3" />
            Edit
          </button>
        </div>
      )}

      <div className="border rounded-lg bg-white">
        {value ? (
          <div className="p-4 prose prose-sm max-w-none">
            <ReactMarkdown>{value}</ReactMarkdown>
          </div>
        ) : (
          <div className="p-4 text-gray-500 italic text-center py-8">
            <FiEye className="w-5 h-5 mx-auto mb-2 opacity-50" />
            No content yet. Click "Edit" to add content.
          </div>
        )}
      </div>
    </div>
  )
}

interface MarkdownFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export const MarkdownField: React.FC<MarkdownFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  height = 200,
}) => {
  return (
    <MarkdownEditor
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      height={height}
      className="w-full"
    />
  )
}

export default MarkdownEditor
