/**
 * Pending Approval Page
 * Displayed to business users while their account is awaiting admin approval
 */

import { AuthGuard } from '@/components/auth'
import PendingApproval from '@/components/business/PendingApproval'

export default function PendingApprovalPage() {
  return (
    <AuthGuard
      requireAuth={true}
      requireEmailVerification={true}
      requireProfileComplete={true}
    >
      <PendingApproval />
    </AuthGuard>
  )
}
