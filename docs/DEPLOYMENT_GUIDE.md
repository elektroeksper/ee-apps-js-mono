# Firebase App Hosting Deployment Guide for pnpm Monorepo

> 🚀 **Quick Start**: Use the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) for fast reference  
> 🔧 **Having Issues?**: Check the [Troubleshooting Guide](./DEPLOYMENT_TROUBLESHOOTING.md) for solutions

## Problem Statement

When deploying a web application from a pnpm monorepo to Firebase App Hosting, the build environment treats the web directory as a standalone project, but the default workspace setup shares a single lockfile at the root. This causes a mismatch error during deployment.

## The Error

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json
```

This happens because:

1. Firebase App Hosting's buildpack automatically detects pnpm and runs `pnpm install` with `--frozen-lockfile` (default in CI)
2. If you copy the root `pnpm-lock.yaml` to the web directory, it contains workspace dependencies that don't match `web/package.json`
3. The buildpack runs its own install BEFORE custom build commands in `apphosting.yaml`

## Solution: Standalone Lockfile for Web Directory

### Step 1: Generate Standalone Lockfile

Create a separate `pnpm-lock.yaml` specifically for the web directory that only includes its own dependencies:

```bash
cd web
rm -f pnpm-lock.yaml  # Remove any existing lockfile
pnpm install --ignore-workspace  # Generate standalone lockfile
```

This creates a lockfile that:

- Only includes dependencies from `web/package.json`
- Doesn't reference workspace packages
- Can be used independently in the cloud build environment

### Step 2: Configure apphosting.yaml

Update `web/apphosting.yaml` to use the standard frozen lockfile install:

```yaml
# Build configuration for monorepo setup
# Build commands will run from web directory
build:
  commands:
    # Install pnpm globally
    - npm install -g pnpm@latest
    # Install dependencies with frozen lockfile (standalone web lockfile)
    - pnpm install --frozen-lockfile
    # Verify shared types are present (should be copied before deployment)
    - node scripts/verify-shared-types.js
    # Build the Next.js application
    - pnpm run build
```

### Step 3: Prepare Shared Types

Before deployment, ensure shared types are copied to the web directory:

```bash
npm run build:shared:web  # From root directory
```

This copies the built shared types to `web/src/shared-generated/`

### Step 4: Deploy

Deploy to Firebase App Hosting:

```bash
# Option 1: Using npm script (if configured)
npm run web:deploy:test  # From root directory

# Option 2: Direct Firebase CLI command
cd web
firebase deploy --only apphosting --project elektro-ekspert-apps
```

**Important**: The deployment command must be run from the `web/` directory where the `apphosting.yaml` is located.

## Key Files Structure

```
project-root/
├── pnpm-lock.yaml           # Root workspace lockfile
├── pnpm-workspace.yaml      # Workspace configuration
├── package.json             # Root package.json with workspaces
├── scripts/
│   └── build-shared-types.js
├── shared/                  # Shared types package
└── web/
    ├── pnpm-lock.yaml       # STANDALONE lockfile (NOT workspace)
    ├── package.json         # Web app dependencies
    ├── apphosting.yaml      # Firebase App Hosting config
    ├── firebase.json        # Firebase config
    ├── scripts/
    │   └── verify-shared-types.js
    └── src/
        └── shared-generated/  # Copied shared types

```

## Important Notes

1. **Two Lockfiles**: The project maintains two separate lockfiles:
   - Root `pnpm-lock.yaml`: For local development with workspace
   - `web/pnpm-lock.yaml`: Standalone for deployment

2. **Keep Lockfiles in Sync**: When adding/updating dependencies in web:

   ```bash
   # Update root workspace
   pnpm install  # From root

   # Update standalone web lockfile
   cd web && pnpm install --ignore-workspace
   ```

3. **Git Tracking**: Both lockfiles should be committed to version control

4. **Shared Types**: Always ensure shared types are built and copied before deployment

5. **Do NOT**:
   - Copy root `pnpm-lock.yaml` to web directory
   - Use `--no-frozen-lockfile` in production builds
   - Try to use workspace references in the deployed environment

## Deployment Methods

### Method 1: Local Source Upload (No GitHub Required)

Firebase App Hosting supports deployment from local source without GitHub integration:

```bash
# From web directory
cd web
firebase deploy --only apphosting --project elektro-ekspert-apps
```

This method:

- Uploads your local web directory to Google Cloud Storage
- Triggers a build in Google Cloud Build
- Deploys the built container to Cloud Run
- No GitHub repository connection required

### Method 2: GitHub Integration (Optional)

For CI/CD workflows, you can connect your backend to a GitHub repository and trigger deployments on push.

## Deployment Checklist

- [ ] Shared types are built and copied to `web/src/shared-generated/`
- [ ] `web/pnpm-lock.yaml` exists and is up-to-date with `web/package.json`
- [ ] `apphosting.yaml` uses `pnpm install --frozen-lockfile`
- [ ] Firebase CLI is authenticated (`firebase login` if needed)
- [ ] Deploy using correct command: `firebase deploy --only apphosting`

## Troubleshooting

### If deployment fails with lockfile errors:

1. Check build logs: `gcloud builds list --region=europe-west4 --limit=1 --project=<PROJECT_ID>`
2. View detailed logs: `gcloud builds log <BUILD_ID> --region=europe-west4 --project=<PROJECT_ID>`
3. Regenerate standalone lockfile: `cd web && rm -f pnpm-lock.yaml && pnpm install --ignore-workspace`
4. Ensure no workspace references in `web/package.json`
5. Verify all new dependencies are in the lockfile

### If "apphosting:deploy is not a Firebase command" error:

This means you're using an incorrect command. The correct command is:

```bash
firebase deploy --only apphosting
```

NOT `firebase apphosting:deploy` (which doesn't exist)

### Viewing deployment status:

```bash
# List recent builds
gcloud builds list --region=europe-west4 --limit=5 --format="table(id,status,createTime.date())"

# View specific build logs
gcloud builds log <BUILD_ID> --region=europe-west4
```

## Firebase Auth SSR Configuration (Critical for Build Success)

### Problem: Firebase Auth Build-Time Errors

Next.js 15 with static site generation can fail during build if Firebase Auth is initialized during the build process, causing errors like:

```
auth/operation-not-supported-in-this-environment
```

### Solution: Client-Side Only Auth Initialization

The Firebase Auth configuration must be structured to only initialize on the client side:

**Key Requirements for `web/src/lib/firebase-auth-config.ts`:**

1. **Client-Side Detection**: Check `typeof window !== 'undefined'` before any Firebase operations
2. **Lazy Initialization**: Initialize Firebase Auth only when actually needed
3. **Null Handling**: Export `auth` as potentially `null` for SSR safety
4. **Service Updates**: All auth service methods must handle `null` auth instances

**Example Configuration:**

```typescript
// Build-time safety check
const isClientSide = typeof window !== 'undefined'

// Lazy initialization function
const getFirebaseApp = () => {
  if (!isClientSide) {
    return null
  }

  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApp()
    }
  }
  return app
}

// Export auth as potentially null
export const auth = isClientSide ? getAuth(getFirebaseApp()!) : null
```

**Auth Service Updates Required:**

- Add `getAuth()` helper method that checks for null
- Update all auth operations to use the helper
- Add client-side checks in methods like `getCurrentUser()` and `isEmailVerified()`

### Dynamic Imports for Components

Components using Firebase Auth should use dynamic imports to avoid SSR issues:

```typescript
// In components
const { auth } = await import('@/lib/firebase-auth-config')
if (!auth) {
  throw new Error('Firebase Auth not available')
}
```

## Deployment Verification Steps

### 1. Local Build Test

Before deploying, always test the build locally:

```bash
cd web
npm run build
```

**Expected Output:**

- ✅ Build completes successfully (no errors)
- ⚠️ Firebase Auth warnings during static generation are **normal**
- ✅ All pages generate successfully
- ✅ No TypeScript errors

### 2. Deploy to Test Environment

```bash
cd /path/to/project-root
./deploy-apphosting.sh
# Select option 1 for test environment
```

### 3. Monitor Deployment

```bash
# Check build status
gcloud logging read 'resource.type="build" timestamp>"YYYY-MM-DDTHH:MM:SSZ"' --limit=5 --project=elektro-ekspert-apps

# Look for success indicators:
# - "DONE" status
# - No "ERR_PNPM_OUTDATED_LOCKFILE" errors
# - Container push completed
```

## Success Indicators

- Build status shows `SUCCESS` in gcloud
- Local build completes without errors
- No lockfile mismatch errors in build logs
- Firebase Auth warnings during build are normal and expected
- Deployed app loads correctly in browser
- All authentication features work properly

## Recent Deployment Fixes Applied (September 2025)

### Issues Resolved:

1. **Document Upload 500/401 Errors**: Fixed by implementing dual authentication system
2. **Firebase Auth Build Failures**: Resolved with client-side only initialization
3. **pnpm Lockfile Mismatch**: Fixed by creating standalone web lockfile with `--ignore-workspace`

### Key Files Modified:

- `/web/src/lib/firebase-auth-config.ts`: Client-side only auth initialization
- `/web/src/services/auth.service.ts`: Added null handling and client-side checks
- `/web/pnpm-lock.yaml`: Standalone lockfile with formidable dependencies
- `/web/apphosting.yaml`: Optimized build configuration

### Successful Deployment Result:

- **Test Environment**: ✅ https://ee-next-test--elektro-ekspert-apps.europe-west4.hosted.app
- **Build Time**: ~10-12 seconds
- **All Features**: Document uploads, authentication, admin panel working

```

```
