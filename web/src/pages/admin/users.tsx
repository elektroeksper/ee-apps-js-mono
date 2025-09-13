'use client'

import { AuthGuard } from '@/components/auth'
import BusinessDocumentModal from '@/components/BusinessDocumentModal'
import RejectReasonModal from '@/components/RejectReasonModal'
import { useAuth } from '@/contexts/AuthContext'
import { userService } from '@/services/auth'
import { AccountType, AuthRole, IAppUser } from '@/shared-generated'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiEdit3,
  FiEye,
  FiFileText,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi'

// Helper function to compute profile completion for any user
function computeIsProfileComplete(user: IAppUser): boolean {
  if (!user) return false

  // Basic required fields for all users
  const hasBasicInfo = !!(
    user.firstName &&
    user.lastName &&
    user.email &&
    user.isEmailVerified
  )

  if (!hasBasicInfo) return false

  // For business users, check business-specific requirements
  if (user.accountType === AccountType.BUSINESS) {
    const businessProfile = user as any
    const businessInfo = businessProfile.businessInfo || {}
    const hasDocuments =
      businessProfile.documents && businessProfile.documents.length > 0

    // Business profile is complete if:
    // 1. Has basic info AND
    // 2. Has company name AND
    // 3. Has uploaded documents (required for approval)
    return !!(businessInfo.companyName && hasDocuments)
  }

  // For regular users, basic info is sufficient
  return true
}

interface IUserFilter {
  search: string
  accountType: AccountType | 'all'
  role: AuthRole | 'all'
  emailVerified: 'all' | 'verified' | 'unverified'
  businessApproval: 'all' | 'pending' | 'approved' | 'rejected'
}

export default function AdminUsersPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminUsersPageContent />
    </AuthGuard>
  )
}

function AdminUsersPageContent() {
  const {
    appUser: currentUser,
    isLoading: userLoading,
    isAdmin,
  } = useAuth() as any
  const [users, setUsers] = useState<IAppUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<IAppUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [documentModalUser, setDocumentModalUser] = useState<IAppUser | null>(
    null
  )
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [filters, setFilters] = useState<IUserFilter>({
    search: '',
    accountType: 'all',
    role: 'all',
    emailVerified: 'all',
    businessApproval: 'all',
  })

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await userService.getAll({})
      if (result.success && result.data) {
        setUsers(result.data)
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  // Approve business user
  const approveBusiness = useCallback(
    async (userId: string) => {
      setActionLoading(userId)
      setError(null)

      try {
        const result = await userService.approveBusiness(userId)

        if (result.success) {
          await fetchUsers()
        } else {
          setError(result.error || 'Failed to approve business')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve business')
      } finally {
        setActionLoading(null)
      }
    },
    [fetchUsers]
  )

  // Reject business user
  const rejectBusiness = useCallback(
    async (userId: string, reason?: string) => {
      console.log('🔴 Users page: rejectBusiness called', { userId, reason })
      setActionLoading(userId)
      setError(null)

      try {
        console.log('🔴 Users page: Calling userService.rejectBusiness')
        const result = await userService.rejectBusiness(userId, reason)
        console.log('🔴 Users page: rejectBusiness result:', result)

        if (result.success) {
          await fetchUsers()
        } else {
          setError(result.error || 'Failed to reject business')
        }
      } catch (err: any) {
        console.error('🔴 Users page: rejectBusiness error:', err)
        setError(err.message || 'Failed to reject business')
      } finally {
        setActionLoading(null)
      }
    },
    [fetchUsers]
  )

  // Modal handlers
  const handleApproveFromModal = async (userId: string) => {
    return approveBusiness(userId)
  }

  const handleRejectFromModal = () => {
    if (documentModalUser) {
      const extendedUser = documentModalUser as any
      const businessName =
        extendedUser?.businessInfo?.businessName ||
        extendedUser?.businessInfo?.companyName ||
        'İşletme'
      // DON'T set documentModalUser to null here - we need it for handleRejectWithReason
      setRejectModalOpen(true) // Open reject reason modal
    }
  }

  const handleRejectWithReason = async (reason: string) => {
    console.log('🔴 Users page: handleRejectWithReason called', {
      reason,
      documentModalUser: documentModalUser?.id,
    })
    if (documentModalUser) {
      console.log(
        '🔴 Users page: Calling rejectBusiness for user:',
        documentModalUser.id
      )
      await rejectBusiness(documentModalUser.id, reason)
      console.log('🔴 Users page: rejectBusiness completed')
      setDocumentModalUser(null)
      setRejectModalOpen(false)
    } else {
      console.log('🔴 Users page: No documentModalUser found')
    }
  }

  const handleCloseDocumentModal = () => {
    setDocumentModalUser(null)
  }

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false)
  }

  // Filter users based on filters
  useEffect(() => {
    let filtered = [...users]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        user =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.displayName.toLowerCase().includes(searchLower)
      )
    }

    // Account type filter
    if (filters.accountType !== 'all') {
      filtered = filtered.filter(
        user => user.accountType === filters.accountType
      )
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user =>
        user.roles.includes(filters.role as AuthRole)
      )
    }

    // Email verified filter
    if (filters.emailVerified !== 'all') {
      const isVerified = filters.emailVerified === 'verified'
      filtered = filtered.filter(user => user.isEmailVerified === isVerified)
    }

    // Business approval filter
    if (filters.businessApproval !== 'all') {
      filtered = filtered.filter(user => {
        // Only filter business users
        if (user.accountType !== AccountType.BUSINESS) return true

        const extendedUser = user as any
        const isApproved = extendedUser?.businessInfo?.isApproved
        const isRejected = extendedUser?.businessInfo?.rejectedAt

        switch (filters.businessApproval) {
          case 'pending':
            return isApproved === undefined || isApproved === null
          case 'approved':
            return isApproved === true
          case 'rejected':
            return isRejected !== undefined
          default:
            return true
        }
      })
    }

    setFilteredUsers(filtered)
  }, [users, filters])

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-admin p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 font-medium">Yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-admin-card rounded-2xl shadow-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <FiArrowLeft className="h-5 w-5 mr-2" />
                </Link>
                <div className="h-6 w-px bg-slate-300"></div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Kullanıcı Yönetimi
                  </h1>
                  <p className="text-slate-600">
                    Toplam {filteredUsers.length} kullanıcı
                  </p>
                </div>
              </div>
              <button
                onClick={fetchUsers}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-admin-card rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Account Type Filter */}
            <select
              value={filters.accountType}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  accountType: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              <option value="all">Tüm Hesap Türleri</option>
              <option value={AccountType.INDIVIDUAL}>Bireysel</option>
              <option value={AccountType.BUSINESS}>İşletme</option>
            </select>

            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={e =>
                setFilters(prev => ({ ...prev, role: e.target.value as any }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Roller</option>
              <option value={AuthRole.USER}>Kullanıcı</option>
              <option value={AuthRole.ADMIN}>Yönetici</option>
              <option value={AuthRole.MODERATOR}>Moderatör</option>
            </select>

            {/* Email Verification Filter */}
            <select
              value={filters.emailVerified}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  emailVerified: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Email Durumları</option>
              <option value="verified">Doğrulanmış</option>
              <option value="unverified">Doğrulanmamış</option>
            </select>

            {/* Business Approval Filter */}
            <select
              value={filters.businessApproval}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  businessApproval: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm İşletme Durumları</option>
              <option value="pending">Onay Bekleyen</option>
              <option value="approved">Onaylanmış</option>
              <option value="rejected">Reddedilmiş</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <FiAlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Kullanıcılar yükleniyor...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Kullanıcı bulunamadı
              </h3>
              <p className="text-slate-500">
                Arama kriterlerinize uygun kullanıcı bulunamadı.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      Hesap Türü
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      Durum
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      Kayıt Tarihi
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map(user => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.displayName}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <div className="flex items-center space-x-1">
                                <FiMail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center space-x-1">
                                  <FiPhone className="h-3 w-3" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.accountType === AccountType.BUSINESS
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {user.accountType === AccountType.BUSINESS ? (
                            <>
                              <FiUsers className="h-3 w-3 mr-1" />
                              İşletme
                            </>
                          ) : (
                            <>
                              <FiUser className="h-3 w-3 mr-1" />
                              Bireysel
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map(role => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                role === AuthRole.ADMIN ||
                                role === AuthRole.MODERATOR
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {role === AuthRole.ADMIN ||
                              role === AuthRole.MODERATOR ? (
                                <FiShield className="h-3 w-3 mr-1" />
                              ) : (
                                <FiUser className="h-3 w-3 mr-1" />
                              )}
                              {role === AuthRole.ADMIN
                                ? 'Admin'
                                : role === AuthRole.MODERATOR
                                  ? 'Moderatör'
                                  : 'Kullanıcı'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              user.isEmailVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isEmailVerified
                              ? 'Email Doğrulandı'
                              : 'Email Doğrulanmadı'}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              computeIsProfileComplete(user)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {computeIsProfileComplete(user)
                              ? 'Profil Tamamlandı'
                              : 'Profil Eksik'}
                          </span>
                          {user.accountType === AccountType.BUSINESS &&
                            (() => {
                              const extendedUser = user as any
                              const isApproved =
                                extendedUser?.businessInfo?.isApproved
                              const isRejected =
                                extendedUser?.businessInfo?.rejectedAt

                              if (isApproved === true) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                    <FiCheck className="h-3 w-3 mr-1" />
                                    İşletme Onaylandı
                                  </span>
                                )
                              } else if (isRejected) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                                    <FiX className="h-3 w-3 mr-1" />
                                    İşletme Reddedildi
                                  </span>
                                )
                              } else {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <FiClock className="h-3 w-3 mr-1" />
                                    İşletme Onay Bekliyor
                                  </span>
                                )
                              }
                            })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <FiEdit3 className="h-4 w-4" />
                          </button>

                          {/* Business Document Inspection */}
                          {user.accountType === AccountType.BUSINESS &&
                            (() => {
                              const extendedUser = user as any
                              const isApproved =
                                extendedUser?.businessInfo?.isApproved
                              const isRejected =
                                extendedUser?.businessInfo?.rejectedAt

                              if (isApproved !== true && !isRejected) {
                                return (
                                  <button
                                    onClick={() => setDocumentModalUser(user)}
                                    className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                    title="Belgeleri İncele"
                                  >
                                    <FiFileText className="h-4 w-4" />
                                  </button>
                                )
                              }
                              return null
                            })()}

                          <button className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        <BusinessDocumentModal
          user={documentModalUser}
          isOpen={!!documentModalUser}
          onClose={handleCloseDocumentModal}
          onApprove={handleApproveFromModal}
          onReject={handleRejectFromModal}
          isLoading={!!actionLoading}
        />

        <RejectReasonModal
          isOpen={rejectModalOpen}
          onClose={handleCloseRejectModal}
          onReject={handleRejectWithReason}
          isLoading={!!actionLoading}
          businessName={
            documentModalUser
              ? (documentModalUser as any)?.businessInfo?.businessName ||
                (documentModalUser as any)?.businessInfo?.companyName ||
                'İşletme'
              : 'İşletme'
          }
        />
      </div>
    </div>
  )
}
