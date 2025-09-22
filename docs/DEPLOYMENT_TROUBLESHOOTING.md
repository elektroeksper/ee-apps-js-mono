# Firebase App Hosting Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. ERR_PNPM_OUTDATED_LOCKFILE

**Error:**

```
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile"
because pnpm-lock.yaml is not up to date with <ROOT>/package.json
```

**Root Cause:**
Firebase App Hosting buildpack enforces `--frozen-lockfile` internally, even if your `apphosting.yaml` specifies `--no-frozen-lockfile`.

**Solution:**

1. Create a standalone lockfile for the web directory:

```bash
cd web
rm -f pnpm-lock.yaml
pnpm install --ignore-workspace
```

2. Verify the lockfile contains all required dependencies:

```bash
grep "formidable" web/pnpm-lock.yaml  # Should show entries
```

3. Commit the standalone lockfile to git

**Prevention:**

- Always use `--ignore-workspace` when regenerating the web lockfile
- Never copy the root workspace lockfile to the web directory
- Keep both lockfiles (root and web) synchronized when adding dependencies

### 2. Firebase Auth Build-Time Errors

**Error:**

```
auth/operation-not-supported-in-this-environment
Failed to compile.
Type error: Argument of type 'Auth | null' is not assignable to parameter of type 'Auth'
```

**Root Cause:**
Firebase Auth being initialized during Next.js static site generation (build time) instead of only on the client side.

**Solution:**

1. Update Firebase Auth configuration to be client-side only:

```typescript
// firebase-auth-config.ts
const isClientSide = typeof window !== 'undefined'
export const auth = isClientSide ? getAuth(getFirebaseApp()!) : null
```

2. Update all auth service methods to handle null auth:

```typescript
private getAuth() {
  if (!auth) {
    throw new Error('Firebase Auth not available. This operation should only be performed on the client side.');
  }
  return auth;
}
```

3. Add client-side checks in components:

```typescript
const { auth } = await import('@/lib/firebase-auth-config')
if (!auth) {
  throw new Error('Firebase Auth not available')
}
```

**Verification:**

- Local build should complete successfully: `npm run build`
- Firebase Auth warnings during build are **normal and expected**
- No TypeScript compilation errors

### 3. Document Upload API Errors (500/401)

**Error:**

```
500 Internal Server Error
401 Unauthorized
```

**Root Cause:**
Authentication mismatch between client-side Firebase Auth and server-side API routes.

**Solution:**
Implement dual authentication system that supports both session cookies and ID tokens:

```typescript
// API route example
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Try session cookie first
    const sessionCookie = req.cookies.__session
    let decodedToken

    if (sessionCookie) {
      decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true)
    } else {
      // Fallback to ID token from Authorization header
      const idToken = req.headers.authorization?.replace('Bearer ', '')
      if (!idToken) {
        return res.status(401).json({ error: 'No authentication found' })
      }
      decodedToken = await admin.auth().verifyIdToken(idToken)
    }

    // Continue with authenticated request...
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' })
  }
}
```

### 4. Build Step Failure (Status Code 51)

**Error:**

```
ERROR: failed to build: executing lifecycle: failed with status code: 51
build step 2 "gcr.io/k8s-skaffold/pack" failed: step exited with non-zero status: 1
```

**Root Cause:**
Usually indicates a dependency or build configuration issue that prevents the Node.js buildpack from completing.

**Investigation Steps:**

1. Check detailed build logs:

```bash
gcloud logging read 'resource.labels.build_id="BUILD_ID"' --limit=50 --project=elektro-ekspert-apps
```

2. Look for specific error messages before the status code 51

3. Common causes:
   - Lockfile mismatch (see solution #1)
   - Missing dependencies
   - Build script failures
   - Environment variable issues

**Solution:**

- Fix the underlying issue (usually lockfile or dependency related)
- Ensure all required dependencies are in `web/package.json`
- Verify build scripts work locally: `npm run build`

### 5. Firebase Function Deployment Conflicts

**Error:**

```
Cannot find module 'formidable'
Module not found: Can't resolve '@/shared-generated'
```

**Root Cause:**
Dependencies or shared types not properly available in the deployment environment.

**Solution:**

1. Ensure formidable is in `web/package.json` dependencies (not devDependencies)
2. Verify shared types are copied before deployment:

```bash
npm run build:shared:web  # From root directory
```

3. Check that `web/src/shared-generated/` contains the built types

## Debugging Tools

### 1. Local Build Testing

```bash
cd web
npm run build  # Should complete without errors
npm run start  # Test the built application
```

### 2. Cloud Build Logs

```bash
# List recent builds
gcloud builds list --region=europe-west4 --limit=5 --project=elektro-ekspert-apps

# Get detailed logs for specific build
gcloud logging read 'resource.labels.build_id="BUILD_ID"' --limit=100 --project=elektro-ekspert-apps
```

### 3. Dependency Verification

```bash
# Check if dependency is in lockfile
grep "package-name" web/pnpm-lock.yaml

# Verify package.json and lockfile alignment
cd web && pnpm install --dry-run
```

### 4. Firebase Console Monitoring

- **App Hosting Dashboard**: https://console.firebase.google.com/project/elektro-ekspert-apps/apphosting
- **Cloud Build History**: https://console.cloud.google.com/cloud-build/builds
- **Cloud Run Services**: https://console.cloud.google.com/run

## Prevention Checklist

Before deploying:

- [ ] Local build completes successfully (`npm run build`)
- [ ] Shared types are built and copied (`npm run build:shared:web`)
- [ ] Web lockfile is up-to-date with dependencies (`web/pnpm-lock.yaml`)
- [ ] No workspace references in web lockfile
- [ ] Firebase Auth uses client-side only initialization
- [ ] All new dependencies are in `web/package.json`
- [ ] Authentication APIs use dual auth pattern

## Recovery Steps

If deployment fails:

1. **Identify the issue** using build logs
2. **Fix locally** and test with `npm run build`
3. **Update lockfile** if dependencies changed: `cd web && pnpm install --ignore-workspace`
4. **Redeploy** using the deployment script
5. **Monitor** the new build logs for success

## Success Metrics

A successful deployment should show:

- ✅ Build completes in ~10-15 seconds
- ✅ No ERR_PNPM_OUTDATED_LOCKFILE errors
- ✅ Container successfully pushed to registry
- ✅ Cloud Run service updates successfully
- ✅ Application loads and functions properly
- ✅ All authentication features work
- ✅ Document upload APIs respond correctly

## Contact & Support

For deployment issues:

1. Check this troubleshooting guide first
2. Review build logs for specific error messages
3. Test locally before deploying
4. Ensure all preventive steps are followed

**Last Updated:** September 22, 2025
**Successful Deployment Reference:** ee-next-test (Build ID: a33fe6a9-79e3-4a0e-b1ce-e9d3bdeedd41)
