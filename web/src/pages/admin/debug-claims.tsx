import { AuthGuard } from '@/components/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function AdminDebugClaimsPage() {
  return (
    <AuthGuard requireAuth requireAdmin>
      <DebugContent />
    </AuthGuard>
  )
}

function DebugContent() {
  const { fireUser, appUser, isAdmin, userRoles, hasRole, hasAnyRole } =
    useAuth()
  const [tokenClaims, setTokenClaims] = useState<Record<string, any> | null>(
    null
  )
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadClaims() {
      if (!fireUser) return
      try {
        setLoadingClaims(true)
        // fireUser in the shared types is a simplified IFirebaseUser without
        // the firebase.User methods — cast to any to access runtime method
        // getIdTokenResult which is available on the real Firebase User.
        const result = await (fireUser as any).getIdTokenResult(false)
        if (active) setTokenClaims(result.claims)
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load claims')
      } finally {
        if (active) setLoadingClaims(false)
      }
    }
    loadClaims()
    return () => {
      active = false
    }
  }, [fireUser])

  const roleProbe = ['admin', 'ADMIN', 'moderator', 'business_owner']

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Admin Role / Claims Debug</h1>
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white p-4 rounded shadow-sm border">
            <h2 className="font-semibold mb-2">Computed State</h2>
            <ul className="text-sm space-y-1">
              <li>
                <strong>fireUser:</strong> {fireUser?.email || '—'}
              </li>
              <li>
                <strong>appUser.id:</strong> {appUser?.id || '—'}
              </li>
              <li>
                <strong>isAdmin:</strong> {String(isAdmin)}
              </li>
              <li>
                <strong>userRoles (merged):</strong>{' '}
                {userRoles.join(', ') || '—'}
              </li>
              {roleProbe.map(r => (
                <li key={r} className="pl-2">
                  hasRole('{r}') → {String(hasRole(r))}
                </li>
              ))}
              <li>
                hasAnyRole(['moderator','content_moderator']) →{' '}
                {String(hasAnyRole(['moderator', 'content_moderator']))}
              </li>
            </ul>
          </section>
          <section className="bg-white p-4 rounded shadow-sm border overflow-auto">
            <h2 className="font-semibold mb-2 flex items-center justify-between">
              Raw Claims{' '}
              {loadingClaims && (
                <span className="text-xs text-slate-500">loading…</span>
              )}
            </h2>
            <pre className="text-xs whitespace-pre-wrap break-all">
              {tokenClaims
                ? JSON.stringify(tokenClaims, null, 2)
                : 'No claims loaded'}
            </pre>
          </section>
        </div>
        <p className="text-xs text-slate-500">
          This page helps verify whether the admin claim or role variants are
          recognized. Remove in production.
        </p>
      </div>
    </div>
  )
}
