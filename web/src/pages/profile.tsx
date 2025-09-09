import { AuthGuard } from '@/components/auth/AuthGuard'
import Header from '@/components/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
// useUser hook no longer needed here; we get everything from useAuth
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

function ProfileContent() {
  const { appUser, logout, updateUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    displayName: appUser?.displayName || '',
    phoneNumber: appUser?.phone || '',
  })

  // Update form data when userProfile changes
  useEffect(() => {
    setFormData({
      displayName: appUser?.displayName || '',
      phoneNumber: appUser?.phone || '',
    })
  }, [appUser])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (appUser) {
        await updateUser({
          displayName: formData.displayName,
          phone: formData.phoneNumber,
        })
        setSuccess('Profil başarıyla güncellendi!')
        setIsEditing(false)
      }
    } catch (err: any) {
      setError(err.message || 'Profil güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/home" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Profil</li>
          </ol>
        </nav>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                {appUser?.photoURL ? (
                  <img
                    src={appUser.photoURL as string}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {appUser?.displayName || 'Kullanıcı'}
                </h1>
                <p className="text-gray-600">{appUser?.email}</p>
              </div>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Profili Düzenle
              </Button>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Profil Bilgileri
          </h2>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                <Input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <Input
                  type="email"
                  value={appUser?.email || ''}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  E-posta adresi değiştirilemez
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon Numarası
                </label>
                <Input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Telefon numaranızı girin"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setError('')
                    setSuccess('')
                  }}
                >
                  İptal
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <p className="text-gray-900">
                  {appUser?.displayName || 'Belirtilmemiş'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi
                </label>
                <p className="text-gray-900">{appUser?.email}</p>
                {appUser?.isEmailVerified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Doğrulanmış
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon Numarası
                </label>
                <p className="text-gray-900">
                  {appUser?.phone || 'Belirtilmemiş'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hesap Oluşturma Tarihi
                </label>
                <p className="text-gray-900">
                  {appUser?.createdAt
                    ? new Date(appUser.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Bilinmiyor'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Son Giriş
                </label>
                <p className="text-gray-900">
                  {appUser?.lastLoginAt
                    ? new Date(appUser.lastLoginAt).toLocaleDateString(
                        'tr-TR',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )
                    : 'Bilinmiyor'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Hesap İşlemleri
          </h2>

          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Şifre Değiştir
              </h3>
              <p className="text-gray-600 mb-4">
                Hesabınızın güvenliği için şifrenizi düzenli olarak değiştirin.
              </p>
              <Link href="/change-password">
                <Button variant="outline">Şifre Değiştir</Button>
              </Link>
            </div>

            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                İki Faktörlü Kimlik Doğrulama
              </h3>
              <p className="text-gray-600 mb-4">
                Hesabınızı ekstra güvenlik katmanı ile koruyun.
              </p>
              <Button variant="outline" disabled>
                Yakında
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Hesabı Sil
              </h3>
              <p className="text-gray-600 mb-4">
                Hesabınızı kalıcı olarak silmek isterseniz, bu işlem geri
                alınamaz.
              </p>
              <Button
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard requireAuth={true} requireEmailVerification={true}>
      <ProfileContent />
    </AuthGuard>
  )
}
