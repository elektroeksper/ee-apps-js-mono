'use client'

import { useBusiness } from '@/hooks/useBusinessQueries'
import { AccountType, BusinessUserRole, IAppUser } from '@/shared'
import React from 'react'
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
  FiX,
} from 'react-icons/fi'
import { HiOfficeBuilding } from 'react-icons/hi'

interface UserDetailModalProps {
  user: IAppUser
  isOpen: boolean
  onClose: () => void
}

export default function UserDetailModal({
  user,
  isOpen,
  onClose,
}: UserDetailModalProps) {
  if (!isOpen || !user) return null

  const { data: businessResult } = useBusiness(user.businessInfo?.businessId)

  const userBusinessInfo = React.useMemo(
    () => businessResult?.data?.users[user.id],
    [businessResult, user.id]
  )

  // Helper function to format dates

  const formatDate = (date: any) => {
    if (!date) return 'Bilinmiyor'
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleBadge = (role: BusinessUserRole) => {
    const colors = {
      [BusinessUserRole.OWNER]: 'bg-purple-100 text-purple-800',
      [BusinessUserRole.MANAGER]: 'bg-blue-100 text-blue-800',
      [BusinessUserRole.TECHNICIAN]: 'bg-green-100 text-green-800',
      [BusinessUserRole.SUPPORT]: 'bg-orange-100 text-orange-800',
    }

    const labels = {
      [BusinessUserRole.OWNER]: 'Sahip',
      [BusinessUserRole.MANAGER]: 'Yönetici',
      [BusinessUserRole.TECHNICIAN]: 'Teknisyen',
      [BusinessUserRole.SUPPORT]: 'Destek',
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role]}`}
      >
        {labels[role]}
      </span>
    )
  }

  const getAccountTypeBadge = (accountType: AccountType) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          accountType === AccountType.BUSINESS
            ? 'bg-orange-100 text-orange-800'
            : 'bg-blue-100 text-blue-800'
        }`}
      >
        {accountType === AccountType.BUSINESS ? (
          <>
            <HiOfficeBuilding className="h-3 w-3 mr-1" />
            İşletme
          </>
        ) : (
          <>
            <FiUser className="h-3 w-3 mr-1" />
            Bireysel
          </>
        )}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.displayName}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {getAccountTypeBadge(user.accountType)}
                  {user.businessInfo?.role &&
                    getRoleBadge(user.businessInfo.role)}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* User Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Temel Bilgiler
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FiUser className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Ad Soyad</p>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FiMail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">E-posta</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="flex items-center space-x-3">
                    <FiPhone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Telefon</p>
                      <p className="font-medium">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <FiCalendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Kayıt Tarihi</p>
                    <p className="font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            {user.address && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Adres Bilgileri
                </h4>
                <div className="flex items-start space-x-3">
                  <FiMapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">
                      {user.address.street} {user.address.doorNumber || ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.address.district}, {user.address.city}{' '}
                      {user.address.postalCode || user.address.zipCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.address.country}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Business Information */}
            {user.businessInfo && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  İşletme Bilgileri
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">İşletme ID</span>
                    <span className="font-medium">
                      {user.businessInfo.businessId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rol</span>
                    <span className="font-medium">
                      {getRoleBadge(user.businessInfo.role)}
                    </span>
                  </div>

                  {userBusinessInfo?.role && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Rol</span>
                      <span className="font-medium">
                        {userBusinessInfo.role}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Durum</span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        user.businessInfo.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.businessInfo.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  {userBusinessInfo?.joinedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Katılım Tarihi
                      </span>
                      <span className="font-medium">
                        {formatDate(userBusinessInfo.joinedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Status */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Hesap Durumu
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    E-posta Doğrulama
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      user.isEmailVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isEmailVerified ? (
                      <>
                        <FiCheck className="h-3 w-3 mr-1" />
                        Doğrulandı
                      </>
                    ) : (
                      <>
                        <FiClock className="h-3 w-3 mr-1" />
                        Doğrulanmadı
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Telefon Doğrulama
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      user.isPhoneVerified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isPhoneVerified ? (
                      <>
                        <FiCheck className="h-3 w-3 mr-1" />
                        Doğrulandı
                      </>
                    ) : (
                      <>
                        <FiClock className="h-3 w-3 mr-1" />
                        Doğrulanmadı
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Hesap Durumu</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>

                {/* Admin Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Yönetici Yetkisi
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      (user as any).isAdmin ||
                      (user as any).customClaims?.admin === true
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {(user as any).isAdmin ||
                    (user as any).customClaims?.admin === true ? (
                      <>
                        <svg
                          className="h-3 w-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Yönetici
                      </>
                    ) : (
                      'Standart Kullanıcı'
                    )}
                  </span>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Son Giriş</span>
                    <span className="font-medium">
                      {formatDate(user.lastLoginAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences */}
            {user.preferences && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Tercihler
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Tema</span>
                    <span className="font-medium capitalize">
                      {user.preferences.theme}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Dil</span>
                    <span className="font-medium">
                      {user.preferences.language}
                    </span>
                  </div>

                  {user.preferences.notifications && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">
                        Bildirim Tercihleri
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">E-posta</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              user.preferences.notifications.email
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.preferences.notifications.email
                              ? 'Açık'
                              : 'Kapalı'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Push</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              user.preferences.notifications.push
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.preferences.notifications.push
                              ? 'Açık'
                              : 'Kapalı'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
