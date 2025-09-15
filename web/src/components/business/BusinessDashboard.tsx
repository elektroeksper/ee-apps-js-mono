/**
 * Business Dashboard Component
 * Main dashboard for business management, team, and invitations
 */

'use client'

import {
  BusinessTeamManager,
  InviteUserForm,
} from '@/components/business/InvitationManager'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function BusinessDashboard() {
  const {
    appUser,
    business,
    businessRole,
    canEditBusiness,
    canInviteUsers,
    canManageUsers,
  } = useAuth()

  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'invite'>(
    'overview'
  )
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleInviteSent = (success: boolean, message?: string) => {
    setMessage({
      type: success ? 'success' : 'error',
      text:
        message ||
        (success
          ? 'Invitation sent successfully!'
          : 'Failed to send invitation'),
    })

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000)

    // Switch to team tab after successful invite
    if (success) {
      setTimeout(() => setActiveTab('team'), 1000)
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Business Associated
            </h3>

            <p className="text-gray-600 mb-6">
              You are not currently associated with any business. Create a
              business or accept an invitation to get started.
            </p>

            <div className="space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Create Business
              </button>

              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Join Business
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {business.companyName}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Your role:{' '}
                  <span className="font-medium capitalize">{businessRole}</span>
                </p>
              </div>

              <div className="flex items-center space-x-3">
                {business.isApproved ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg
                      className="mr-1.5 h-2 w-2 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 8 8"
                    >
                      <circle cx={4} cy={4} r={3} />
                    </svg>
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg
                      className="mr-1.5 h-2 w-2 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 8 8"
                    >
                      <circle cx={4} cy={4} r={3} />
                    </svg>
                    Pending Approval
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team ({Object.keys(business.users || {}).length})
            </button>

            {canInviteUsers && (
              <button
                onClick={() => setActiveTab('invite')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invite'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invite Users
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex">
              <div
                className={`flex-shrink-0 ${
                  message.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
                    message.type === 'success'
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage(null)}
                  className={`-mx-1.5 -my-1.5 rounded-md p-1.5 inline-flex ${
                    message.type === 'success'
                      ? 'text-green-500 hover:bg-green-100'
                      : 'text-red-500 hover:bg-red-100'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    message.type === 'success'
                      ? 'focus:ring-green-600'
                      : 'focus:ring-red-600'
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Business Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Company Name
                  </p>
                  <p className="text-sm text-gray-900">
                    {business.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Industry</p>
                  <p className="text-sm text-gray-900">{business.industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{business.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{business.phone}</p>
                </div>
              </div>
            </div>

            {/* Team Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Team Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Total Members
                  </span>
                  <span className="text-sm text-gray-900">
                    {Object.keys(business.users || {}).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Active Members
                  </span>
                  <span className="text-sm text-gray-900">
                    {
                      Object.values(business.users || {}).filter(
                        user => user.isActive
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Your Role
                  </span>
                  <span className="text-sm text-gray-900 capitalize">
                    {businessRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {canEditBusiness && (
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    Edit Business Info
                  </button>
                )}
                {canInviteUsers && (
                  <button
                    onClick={() => setActiveTab('invite')}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    Invite Team Member
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('team')}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  View Team
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <BusinessTeamManager businessId={business.id} />
        )}

        {activeTab === 'invite' && canInviteUsers && (
          <InviteUserForm
            businessId={business.id}
            onInviteSent={handleInviteSent}
          />
        )}
      </div>
    </div>
  )
}
