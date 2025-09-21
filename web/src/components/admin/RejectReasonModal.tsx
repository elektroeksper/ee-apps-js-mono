'use client'

import { useState } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

interface RejectReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onReject: (reason: string) => Promise<void>
  isLoading: boolean
  businessName: string
}

export default function RejectReasonModal({
  isOpen,
  onClose,
  onReject,
  isLoading,
  businessName,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState(
    'Belgeler gereksinimlerimizi karşılamıyor'
  )

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim()) {
      await onReject(reason.trim())
      setReason('Belgeler gereksinimlerimizi karşılamıyor') // Reset for next use
    }
  }

  const handleClose = () => {
    setReason('Belgeler gereksinimlerimizi karşılamıyor') // Reset on cancel
    onClose()
  }

  const commonReasons = [
    'Belgeler gereksinimlerimizi karşılamıyor',
    'Ticaret sicil belgesi eksik veya hatalı',
    'Vergi levhası eksik veya güncel değil',
    'Kimlik belgesi net değil veya eksik',
    'İş yeri ruhsatı eksik',
    'İmza sirküleri eksik veya hatalı',
    'Belgeler okunaksız veya bozuk',
    'Eksik belge bulunmakta',
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              İşletme Reddedilme Sebebi
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center mb-4 p-3 bg-red-50 rounded-lg">
                <FiAlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    <strong>{businessName}</strong> işletmesini reddetmek
                    üzeresiniz
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Bu işlem geri alınamaz ve kullanıcıya email bildirimi
                    gönderilecektir.
                  </p>
                </div>
              </div>

              <label
                htmlFor="reason"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Reddedilme Sebebi <span className="text-red-500">*</span>
              </label>

              {/* Quick reason buttons */}
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-2">
                  Yaygın sebepler (tıklayarak seçin):
                </p>
                <div className="flex flex-wrap gap-2">
                  {commonReasons.map(commonReason => (
                    <button
                      key={commonReason}
                      type="button"
                      onClick={() => setReason(commonReason)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        reason === commonReason
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      disabled={isLoading}
                    >
                      {commonReason}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="İşletme reddedilme sebebini yazın..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                required
                disabled={isLoading}
              />
              <p className="text-sm text-slate-500 mt-2">
                Bu mesaj kullanıcıya gönderilecek email'de yer alacaktır.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                disabled={isLoading}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isLoading || !reason.trim()}
                className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <FiX className="h-4 w-4 mr-2" />
                )}
                Reddet ve Email Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
