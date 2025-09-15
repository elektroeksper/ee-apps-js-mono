/**
 * Business Invitation Management Component
 * Handles sending, viewing, and managing business invitations
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useBusinessOperations } from '@/hooks/useBusiness'
import { BusinessUserRole } from '@/shared-generated'
import React, { useState } from 'react'

// Invitation form component
interface InviteUserFormProps {
  businessId: string
  onInviteSent?: (success: boolean, message?: string) => void
}

export function InviteUserForm({
  businessId,
  onInviteSent,
}: InviteUserFormProps) {
  const { fireUser, canInviteUsers } = useAuth()
  const { inviteUser, isLoading } = useBusinessOperations()

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: BusinessUserRole.TECHNICIAN,
    message: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fireUser || !canInviteUsers) {
      setError('You do not have permission to invite users')
      return
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    setError(null)

    try {
      const result = await inviteUser(
        businessId,
        formData.email.trim(),
        formData.role,
        fireUser.uid,
        formData.name.trim() || undefined
      )

      if (result.success) {
        // Reset form
        setFormData({
          email: '',
          name: '',
          role: BusinessUserRole.TECHNICIAN,
          message: '',
        })
        onInviteSent?.(true, 'Invitation sent successfully!')
      } else {
        setError(result.error || 'Failed to send invitation')
        onInviteSent?.(false, result.error)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to send invitation'
      setError(errorMsg)
      onInviteSent?.(false, errorMsg)
    }
  }

  if (!canInviteUsers) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">
          You do not have permission to invite users to this business.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Invite New User
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={e =>
              setFormData(prev => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Role *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                role: e.target.value as BusinessUserRole,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value={BusinessUserRole.TECHNICIAN}>Technician</option>
            <option value={BusinessUserRole.SUPPORT}>Support</option>
            <option value={BusinessUserRole.MANAGER}>Manager</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Message (Optional)
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={e =>
              setFormData(prev => ({ ...prev, message: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Add a personal message to the invitation..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Invitation acceptance component
interface InvitationAcceptanceProps {
  token: string
  onResult?: (success: boolean, message?: string) => void
}

export function InvitationAcceptance({
  token,
  onResult,
}: InvitationAcceptanceProps) {
  const { acceptBusinessInvitation, fireUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleAccept = async () => {
    if (!fireUser) {
      const errorMsg = 'You must be logged in to accept invitations'
      setResult({ success: false, message: errorMsg })
      onResult?.(false, errorMsg)
      return
    }

    setIsLoading(true)

    try {
      const response = await acceptBusinessInvitation(token)

      if (response.success) {
        const successMsg =
          'Invitation accepted successfully! Welcome to the team.'
        setResult({ success: true, message: successMsg })
        onResult?.(true, successMsg)
      } else {
        const errorMsg = response.error || 'Failed to accept invitation'
        setResult({ success: false, message: errorMsg })
        onResult?.(false, errorMsg)
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to accept invitation'
      setResult({ success: false, message: errorMsg })
      onResult?.(false, errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = () => {
    setResult({ success: false, message: 'Invitation declined.' })
    onResult?.(false, 'Invitation declined')
  }

  if (result) {
    return (
      <div
        className={`rounded-lg p-6 ${
          result.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center">
          <div
            className={`flex-shrink-0 ${
              result.success ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {result.success ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p
              className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Business Invitation
        </h3>

        <p className="text-gray-600 mb-6">
          You've been invited to join a business team. Would you like to accept
          this invitation?
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium border ${
              isLoading
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
            }`}
          >
            Decline
          </button>

          <button
            onClick={handleAccept}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Business team management component
interface BusinessTeamManagerProps {
  businessId: string
}

export function BusinessTeamManager({ businessId }: BusinessTeamManagerProps) {
  const { business, canManageUsers } = useAuth()
  const { removeUser, updateUserRole, isLoading } = useBusinessOperations()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${userName} from the business?`
      )
    ) {
      return
    }

    setActionLoading(`remove-${userId}`)
    setMessage(null)

    try {
      const result = await removeUser(businessId, userId)

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${userName} has been removed from the business.`,
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to remove user',
        })
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to remove user',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleRoleChange = async (
    userId: string,
    userName: string,
    newRole: BusinessUserRole
  ) => {
    setActionLoading(`role-${userId}`)
    setMessage(null)

    try {
      const result = await updateUserRole(businessId, userId, newRole)

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${userName}'s role has been updated.`,
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to update role',
        })
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to update role',
      })
    } finally {
      setActionLoading(null)
    }
  }

  if (!business) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">No business information available.</p>
      </div>
    )
  }

  const users = Object.values(business.users || {})

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
      </div>

      <div className="p-6">
        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No team members found.
          </p>
        ) : (
          <div className="space-y-4">
            {users.map(user => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.userName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === BusinessUserRole.OWNER
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === BusinessUserRole.MANAGER
                          ? 'bg-blue-100 text-blue-800'
                          : user.role === BusinessUserRole.TECHNICIAN
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role}
                  </span>

                  {canManageUsers && user.role !== BusinessUserRole.OWNER && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={user.role}
                        onChange={e =>
                          handleRoleChange(
                            user.userId,
                            user.userName,
                            e.target.value as BusinessUserRole
                          )
                        }
                        disabled={
                          actionLoading === `role-${user.userId}` || isLoading
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={BusinessUserRole.TECHNICIAN}>
                          Technician
                        </option>
                        <option value={BusinessUserRole.SUPPORT}>
                          Support
                        </option>
                        <option value={BusinessUserRole.MANAGER}>
                          Manager
                        </option>
                      </select>

                      <button
                        onClick={() =>
                          handleRemoveUser(user.userId, user.userName)
                        }
                        disabled={
                          actionLoading === `remove-${user.userId}` || isLoading
                        }
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Remove user"
                      >
                        {actionLoading === `remove-${user.userId}` ? (
                          <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
