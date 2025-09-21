'use client'

import AdminLayout from '@/components/admin/AdminLayout'
import { AuthGuard } from '@/components/auth'
import { useAuth } from '@/contexts/AuthContext'
import { businessService } from '@/services/business.service'
import {
  BusinessUserRole,
  BusinessVerificationStatus,
  IAppUser,
  IBusiness,
} from '@/shared-generated'
import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertTriangle,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiEye,
  FiFileText,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { HiOfficeBuilding } from 'react-icons/hi'
import BusinessStatusModal from '../../components/admin/BusinessStatusModal'
import RejectReasonModal from '../../components/admin/RejectReasonModal'
import UserDetailModal from '../../components/admin/UserDetailModal'

interface IUserFilter {
  search: string
  verificationStatus: BusinessVerificationStatus | 'all'
  businessRole: BusinessUserRole | 'all'
}

interface IBusinessGroup {
  business: IBusiness | null
  users: IAppUser[]
}

export default function AdminUsersPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireAdmin={true}
      requireEmailVerification={true}
    >
      <AdminLayout title="Kullanıcı Yönetimi">
        <AdminUsersPageContent />
      </AdminLayout>
    </AuthGuard>
  )
}

function AdminUsersPageContent() {
  const { appUser: currentUser, fireUser } = useAuth() as any
  const [users, setUsers] = useState<IAppUser[]>([])
  const [businesses, setBusinesses] = useState<IBusiness[]>([])
  const [businessGroups, setBusinessGroups] = useState<IBusinessGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Modal states
  const [businessStatusModal, setBusinessStatusModal] =
    useState<IBusiness | null>(null)
  const [userDetailModal, setUserDetailModal] = useState<IAppUser | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [currentBusinessForRejection, setCurrentBusinessForRejection] =
    useState<IBusiness | null>(null)

  const [filters, setFilters] = useState<IUserFilter>({
    search: '',
    verificationStatus: 'all',
    businessRole: 'all',
  })

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (!fireUser) {
        setError('User not authenticated')
        return
      }

      // Get the ID token from the Firebase user
      const firebaseUser = fireUser as any
      const idToken = await firebaseUser.getIdToken(true) // Force refresh

      // Fetch users and businesses with Authorization header
      const [usersResponse, businessesResponse] = await Promise.all([
        fetch('/api/users', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/business', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }),
      ])

      // Handle users response
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`)
      }

      const usersResult = await usersResponse.json()
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data)
      } else {
        setError(usersResult.error || 'Failed to fetch users')
        return
      }

      // Handle businesses response
      if (!businessesResponse.ok) {
        throw new Error(
          `Failed to fetch businesses: ${businessesResponse.status}`
        )
      }

      const businessesResult = await businessesResponse.json()
      if (businessesResult.success && businessesResult.data) {
        setBusinesses(businessesResult.data)
      } else {
        setError(businessesResult.error || 'Failed to fetch businesses')
        return
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [fireUser])

  // Group users by business
  useEffect(() => {
    const groups: IBusinessGroup[] = []
    const processedUsers = new Set<string>()

    // Group business users
    businesses.forEach(business => {
      const businessUsers = users.filter(
        user =>
          user.businessInfo?.businessId === business.id &&
          !processedUsers.has(user.id)
      )

      if (businessUsers.length > 0) {
        groups.push({
          business,
          users: businessUsers,
        })
        businessUsers.forEach(user => processedUsers.add(user.id))
      }
    })

    // Add users without business association
    const independentUsers = users.filter(
      user => !user.businessInfo?.businessId && !processedUsers.has(user.id)
    )

    if (independentUsers.length > 0) {
      groups.push({
        business: null,
        users: independentUsers,
      })
    }

    setBusinessGroups(groups)
  }, [users, businesses])

  // Filter business groups based on filters
  const filteredGroups = businessGroups.filter(group => {
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const hasMatchingUser = group.users.some(
        user =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.displayName &&
            user.displayName.toLowerCase().includes(searchLower))
      )
      const hasMatchingBusiness = group.business?.businessName
        .toLowerCase()
        .includes(searchLower)

      if (!hasMatchingUser && !hasMatchingBusiness) {
        return false
      }
    }

    // Apply verification status filter
    if (filters.verificationStatus !== 'all' && group.business) {
      if (group.business.verification.status !== filters.verificationStatus) {
        return false
      }
    }

    // Apply business role filter
    if (filters.businessRole !== 'all') {
      const hasUserWithRole = group.users.some(
        user => user.businessInfo?.role === filters.businessRole
      )
      if (!hasUserWithRole) {
        return false
      }
    }

    return true
  })

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // Approve business
  const approveBusiness = useCallback(
    async (businessId: string) => {
      if (!businessId) return

      setActionLoading(businessId)
      setError(null)

      try {
        const result = await businessService.approveBusiness(businessId)
        if (result.success) {
          await fetchData()
        } else {
          setError(result.error || 'Failed to approve business')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to approve business')
      } finally {
        setActionLoading(null)
      }
    },
    [fetchData]
  )

  // Reject business
  const rejectBusiness = useCallback(
    async (businessId: string, reason: string) => {
      if (!businessId || !reason.trim()) return

      setActionLoading(businessId)
      setError(null)

      try {
        const result = await businessService.rejectBusiness(
          businessId,
          reason.trim()
        )
        if (result.success) {
          await fetchData()
        } else {
          setError(result.error || 'Failed to reject business')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to reject business')
      } finally {
        setActionLoading(null)
      }
    },
    [fetchData]
  )

  // Modal handlers
  const handleShowBusinessStatus = (business: IBusiness) => {
    setBusinessStatusModal(business)
  }

  const handleShowUserDetail = (user: IAppUser) => {
    setUserDetailModal(user)
  }

  const handleApproveFromModal = async (businessId: string) => {
    await approveBusiness(businessId)
    setBusinessStatusModal(null)
  }

  const handleRejectFromModal = (business: IBusiness) => {
    setCurrentBusinessForRejection(business)
    setBusinessStatusModal(null)
    setRejectModalOpen(true)
  }

  const handleRejectWithReason = async (reason: string) => {
    if (currentBusinessForRejection) {
      await rejectBusiness(currentBusinessForRejection.id!, reason)
      setCurrentBusinessForRejection(null)
      setRejectModalOpen(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getBusinessStatusBadge = (status: BusinessVerificationStatus) => {
    switch (status) {
      case BusinessVerificationStatus.VERIFIED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheck className="h-3 w-3 mr-1" />
            Onaylandı
          </span>
        )
      case BusinessVerificationStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiX className="h-3 w-3 mr-1" />
            Reddedildi
          </span>
        )
      case BusinessVerificationStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="h-3 w-3 mr-1" />
            Onay Bekliyor
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiAlertTriangle className="h-3 w-3 mr-1" />
            Doğrulanmamış
          </span>
        )
    }
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
        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${colors[role]}`}
      >
        {labels[role]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Kullanıcı Yönetimi
                </h1>
                <p className="text-slate-600 mt-2">
                  Toplam{' '}
                  {businessGroups.reduce(
                    (acc, group) => acc + group.users.length,
                    0
                  )}{' '}
                  kullanıcı, {businesses.length} işletme
                </p>
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg transform transition-all hover:scale-105"
              >
                <FiRefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          {/* Search - Full Width */}
          <div className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Kullanıcı veya işletme ara... (İsim, soyisim, email veya işletme adı)"
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
              />
            </div>
          </div>

          {/* Other Filters - Below Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Verification Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Doğrulama Durumu
              </label>
              <select
                value={filters.verificationStatus}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    verificationStatus: e.target.value as
                      | BusinessVerificationStatus
                      | 'all',
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Doğrulama Durumları</option>
                <option value={BusinessVerificationStatus.PENDING}>
                  Onay Bekleyen
                </option>
                <option value={BusinessVerificationStatus.VERIFIED}>
                  Onaylanmış
                </option>
                <option value={BusinessVerificationStatus.REJECTED}>
                  Reddedilmiş
                </option>
                <option value={BusinessVerificationStatus.UNVERIFIED}>
                  Doğrulanmamış
                </option>
              </select>
            </div>

            {/* Business Role Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                İşletme Rolü
              </label>
              <select
                value={filters.businessRole}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    businessRole: e.target.value as BusinessUserRole | 'all',
                  }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tüm Roller</option>
                <option value={BusinessUserRole.OWNER}>Sahip</option>
                <option value={BusinessUserRole.MANAGER}>Yönetici</option>
                <option value={BusinessUserRole.TECHNICIAN}>Teknisyen</option>
                <option value={BusinessUserRole.SUPPORT}>Destek</option>
              </select>
            </div>
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

        {/* Business Groups */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Veriler yükleniyor...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <FiUsers className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Kullanıcı bulunamadı
              </h3>
              <p className="text-slate-500">
                Arama kriterlerinize uygun kullanıcı bulunamadı.
              </p>
            </div>
          ) : (
            filteredGroups.map((group, index) => {
              const groupId = group.business?.id || 'independent'
              const isExpanded = expandedGroups.has(groupId)

              return (
                <div
                  key={groupId}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Group Header */}
                  <div
                    className="p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => toggleGroup(groupId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center text-slate-600">
                          {isExpanded ? (
                            <FiChevronDown className="h-5 w-5" />
                          ) : (
                            <FiChevronRight className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          {group.business ? (
                            <HiOfficeBuilding className="h-5 w-5 text-blue-600" />
                          ) : (
                            <FiUser className="h-5 w-5 text-gray-600" />
                          )}

                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {group.business?.businessName ||
                                'Bağımsız Kullanıcılar'}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {group.users.length} kullanıcı
                            </p>
                          </div>
                        </div>

                        {group.business && (
                          <div className="flex items-center space-x-2">
                            {getBusinessStatusBadge(
                              group.business.verification.status
                            )}
                          </div>
                        )}
                      </div>

                      {group.business && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              handleShowBusinessStatus(group.business!)
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            <FiFileText className="h-4 w-4 mr-1" />
                            İşletme Durumu
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Content */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-200">
                      {group.users.map(user => (
                        <div
                          key={user.id}
                          className="p-4 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <h4 className="font-medium text-slate-900">
                                    {user.displayName}
                                  </h4>
                                  {user.businessInfo?.role &&
                                    getRoleBadge(user.businessInfo.role)}
                                </div>

                                <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                                  <div className="flex items-center space-x-1">
                                    <FiMail className="h-3 w-3" />
                                    <span>{user.email}</span>
                                  </div>
                                  {user.phoneNumber && (
                                    <div className="flex items-center space-x-1">
                                      <FiPhone className="h-3 w-3" />
                                      <span>{user.phoneNumber}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2 mt-2">
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
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleShowUserDetail(user)}
                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Detayları Görüntüle"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Modals */}
        {businessStatusModal && (
          <BusinessStatusModal
            business={businessStatusModal}
            isOpen={!!businessStatusModal}
            onClose={() => setBusinessStatusModal(null)}
            onApprove={handleApproveFromModal}
            onReject={handleRejectFromModal}
            isLoading={!!actionLoading}
          />
        )}

        {userDetailModal && (
          <UserDetailModal
            user={userDetailModal}
            isOpen={!!userDetailModal}
            onClose={() => setUserDetailModal(null)}
          />
        )}

        {rejectModalOpen && (
          <RejectReasonModal
            isOpen={rejectModalOpen}
            onClose={() => {
              setRejectModalOpen(false)
              setCurrentBusinessForRejection(null)
            }}
            onReject={handleRejectWithReason}
            isLoading={!!actionLoading}
            businessName={
              currentBusinessForRejection?.businessName || 'İşletme'
            }
          />
        )}
      </div>
    </div>
  )
}
