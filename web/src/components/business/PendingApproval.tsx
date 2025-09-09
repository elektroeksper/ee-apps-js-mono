/**
 * Pending Approval Component
 * Displayed to business users while their account is awaiting admin approval
 */

import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import React from 'react'
import { FiCheckCircle, FiClock, FiMail } from 'react-icons/fi'

const PendingApproval: React.FC = () => {
  const { appUser, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <FiClock className="h-8 w-8 text-yellow-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Hesabınız Onay Sürecinde
          </h1>

          {/* Message */}
          <div className="text-gray-600 mb-8 space-y-4">
            <p>
              Merhaba <strong>{appUser?.firstName}</strong>,
            </p>
            <p>
              İşletme hesabınız başarıyla oluşturuldu! Bilgileriniz ve
              belgeleriniz yönetici ekibimiz tarafından incelenmektedir.
            </p>
            <p className="text-sm">
              Onay süreci genellikle 1-2 iş günü sürmektedir. İnceleme
              tamamlandığında bir e-posta bildirimi alacaksınız.
            </p>
          </div>

          {/* Status Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100">
                  <FiCheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-green-600 font-medium">
                  Hesap Oluşturuldu
                </span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100">
                  <FiClock className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-yellow-600 font-medium">İnceleme</span>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>

              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <span className="text-gray-400 font-medium">Onay</span>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Bu süre zarfında:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Hesabınıza giriş yapabilirsiniz</li>
              <li>• Profil bilgilerinizi düzenleyebilirsiniz</li>
              <li>• Platformu keşfedebilirsiniz</li>
              <li>• Tam erişim onay sonrası aktif olacaktır</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/profile"
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Profili Düzenle
            </Link>

            <Button variant="outline" onClick={handleLogout} className="w-full">
              Çıkış Yap
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Sorularınız için:{' '}
              <a
                href="mailto:destek@elektroexpert.com"
                className="text-blue-600 hover:text-blue-800"
              >
                destek@elektroexpert.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingApproval
