# Firebase Functions Deployment Guide - Systematic Solutions

> 🎯 **Quick Reference**: Use this guide for troubleshooting Firebase Functions v2 deployment issues  
> 📋 **Related Docs**: [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) | [Troubleshooting Guide](./DEPLOYMENT_TROUBLESHOOTING.md)

## Problem Statement

Firebase Functions v2 deployments often fail with **Cloud Run container health check failures**, particularly when migrating from v1 or dealing with complex monorepo setups. The most common error is:

```
Container Healthcheck failed. The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable within the allocated timeout.
```

## Root Causes and Systematic Solutions

### 1. Module Loading Failures (Most Critical Issue)

**Problem:**
Cloud Run containers fail to start because the Functions Framework cannot load required modules, particularly shared dependencies.

**Error Pattern:**
```
Could not load the function, shutting down.
    at Object.<anonymous> (/workspace/lib/triggers/user-triggers.js:4:18)
    - Cannot find module '@electro-eksper/shared'
```

**Root Cause:**
- TypeScript imports using package names (`@electro-eksper/shared`) instead of relative paths
- Shared dependencies not properly packaged with the deployed function
- Module resolution fails in the Cloud Run environment

**Solution:**
```typescript
// ❌ WRONG - Package name imports fail in Cloud Run
import { IAppUser } from '@electro-eksper/shared'

// ✅ CORRECT - Relative path imports work reliably
import { IAppUser } from '../shared-generated'
```

**Implementation Steps:**
1. Update all imports to use relative paths
2. Ensure shared types are built and copied before deployment
3. Verify shared-generated directory exists in both src and lib

### 2. Reserved Environment Variables

**Problem:**
Firebase Functions v2 reserves certain environment variables for internal use, causing deployment failures.

**Error Pattern:**
```
Error: Failed to load environment variables from .env.:
- Error Key GCLOUD_PROJECT is reserved for internal use.
- Error Key FUNCTION_TARGET is reserved for internal use.
- Error Key PORT is reserved for internal use.
```

**Root Cause:**
Attempting to set reserved environment variables in `.env` files.

**Solution:**
Remove reserved variables from `.env` files:

```bash
# ❌ WRONG - These are reserved
GCLOUD_PROJECT=ee-dev-apps
FUNCTION_TARGET=index
PORT=8080

# ✅ CORRECT - Only set custom variables
PROJECT_ENV=dev
EMAIL_PROVIDER=smtp
```

**Reserved Variables (Do Not Set):**
- `GCLOUD_PROJECT` - Set automatically by Firebase
- `FUNCTION_TARGET` - Set automatically by Functions Framework
- `PORT` - Set automatically by Cloud Run
- `GOOGLE_APPLICATION_CREDENTIALS` - Set by deployment scripts

### 3. Function Trigger Type Conflicts

**Problem:**
Firebase doesn't allow changing function trigger types after deployment.

**Error Pattern:**
```
Changing from an HTTPS function to a background triggered function is not allowed
```

**Root Cause:**
Function previously deployed with different trigger type (e.g., HTTPS) but code now defines it as Firestore trigger.

**Solution:**
```bash
# Delete conflicting functions before redeployment
firebase functions:delete functionName --project=PROJECT_ID --force

# Then redeploy with correct trigger type
firebase deploy --only functions
```

**Prevention:**
- Use consistent trigger types from initial deployment
- Plan function architecture before first deployment
- Use proper function naming conventions

### 4. Inadequate Deployment Configuration

**Problem:**
Basic firebase.json configuration lacks necessary Cloud Run settings for v2 functions.

**Solution:**
Enhanced firebase.json configuration:

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log",
        "*.local"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint",
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ],
      "runtime": "nodejs22",
      "region": "europe-west1"
    }
  ]
}
```

**Key Additions:**
- `runtime`: Explicitly specify Node.js version
- `region`: Set consistent deployment region
- Proper predeploy hooks for linting and building

## Enhanced Deployment Process

### Complete Deployment Script

The successful deployment script (`deploy-with-config.sh`) includes these critical steps:

```bash
#!/bin/bash
set -e

# 1. Environment Selection and Configuration
select_environment() {
    # Interactive environment selection
    # Sets PROJECT, ENV, and SERVICE_ACCOUNT_FILE
}

# 2. Web Environment Synchronization
echo "🔄 Switching web environment to match deployment target..."
cd ../web
if [ "$SELECTED_ENV" == "DEV" ]; then
    ./scripts/switch-to-dev.sh
else
    ./scripts/switch-to-prod.sh
fi
cd ../functions

# 3. Shared Types Building
echo "🔧 Building shared types for functions..."
cd ..
npm run build:shared:functions
cd functions

# 4. Environment File Configuration
ENV_FILE=".env.$([ "$SELECTED_ENV" == "DEV" ] && echo "dev" || echo "prod")"
cp "$ENV_FILE" ".env"

# 5. Service Account Authentication
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/$SERVICE_ACCOUNT_FILE"

# 6. Dependency Installation (if needed)
if [ ! -d "node_modules" ]; then
    npm install
fi

# 7. Build and Deploy
npm run build
firebase deploy --only functions --project=$SELECTED_PROJECT
```

### Key Process Improvements

1. **Web Environment Synchronization**: Ensures web and functions environments match
2. **Shared Types Building**: Guarantees shared dependencies are available
3. **Environment-Specific Configuration**: Uses correct .env files per environment
4. **Service Account Management**: Proper authentication for each environment
5. **Dependency Verification**: Installs missing dependencies before build

## Function Architecture Best Practices

### Proper Function Definitions

**Firestore Triggers (Document Operations):**
```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions/v2'

export const onUserDocumentUpdate = onDocumentUpdated(
  {
    document: 'users/{userId}',
    database: 'native-db',
  },
  async (event) => {
    const beforeData = event.data?.before?.data()
    const afterData = event.data?.after?.data()
    
    // Function logic here
    logger.info('User document updated', { userId: event.params.userId })
  }
)
```

**Callable Functions (API Endpoints):**
```typescript
import { onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'

export const checkUserClaims = onCall(
  { region: 'europe-west1' },
  async (request) => {
    // Validate authentication
    if (!request.auth) {
      throw new Error('Authentication required')
    }
    
    // Function logic here
    return { success: true, data: result }
  }
)
```

### Global Configuration

Set global options in `src/index.ts`:

```typescript
import { setGlobalOptions } from 'firebase-functions/v2'

// Set global options BEFORE importing functions
setGlobalOptions({ 
  region: 'europe-west1', 
  maxInstances: 10 
})

// Then import and export functions
import { checkUserClaims, setAdminsClaims } from './functions/user-functions'
import { onBusinessVerificationStatusChange, onUserDocumentUpdate } from './triggers'

export {
  checkUserClaims,
  onBusinessVerificationStatusChange,
  onUserDocumentUpdate,
  setAdminsClaims
}
```

## Troubleshooting Guide

### Diagnostic Commands

**1. Check Function Status:**
```bash
firebase functions:list --project=PROJECT_ID
```

**2. View Cloud Run Logs:**
```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="FUNCTION_NAME"' --project=PROJECT_ID --limit=20 --format="table(timestamp,textPayload,jsonPayload.message)" --freshness=15m
```

**3. Monitor Deployment:**
```bash
# Follow deployment logs in real-time
firebase deploy --only functions --project=PROJECT_ID --debug
```

### Common Error Patterns and Solutions

| Error Pattern | Root Cause | Solution |
|---------------|------------|----------|
| `Could not load the function` | Module loading failure | Fix import paths to use relative imports |
| `Container Healthcheck failed` | Functions Framework startup failure | Check Cloud Run logs for specific error |
| `reserved for internal use` | Environment variable conflict | Remove reserved vars from .env files |
| `Changing from HTTPS function to background` | Trigger type conflict | Delete function and redeploy |
| `Cannot find module` | Missing dependencies | Rebuild shared types, check package.json |

### Success Verification

After successful deployment, verify:

```bash
# Check all functions are deployed with correct trigger types
firebase functions:list --project=PROJECT_ID

# Expected output:
# ✅ onUserDocumentUpdate - google.cloud.firestore.document.v1.updated
# ✅ onBusinessVerificationStatusChange - google.cloud.firestore.document.v1.updated  
# ✅ checkUserClaims - callable
# ✅ setAdminsClaims - callable
```

## Deployment Checklist

**Pre-Deployment:**
- [ ] All imports use relative paths (`../shared-generated`)
- [ ] No reserved environment variables in .env files
- [ ] Shared types built (`npm run build:shared:functions`)
- [ ] Web environment matches target environment
- [ ] Service account files present for target environment

**During Deployment:**
- [ ] No module loading errors in build output
- [ ] Functions Framework starts successfully
- [ ] Cloud Run health checks pass
- [ ] All functions deploy with correct trigger types

**Post-Deployment:**
- [ ] Functions list shows all expected functions
- [ ] Trigger types match function definitions
- [ ] Functions respond correctly to test invocations
- [ ] No error logs in Cloud Run monitoring

## Migration from Functions v1

When migrating from Firebase Functions v1 to v2:

1. **Update Dependencies:**
```json
{
  "dependencies": {
    "firebase-functions": "^5.0.0",
    "firebase-admin": "^12.1.0"
  }
}
```

2. **Update Import Statements:**
```typescript
// v1 (old)
import * as functions from 'firebase-functions'

// v2 (new)
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
```

3. **Update Function Definitions:**
```typescript
// v1 (old)
exports.myFunction = functions.firestore
  .document('users/{userId}')
  .onUpdate((change, context) => { ... })

// v2 (new)
export const myFunction = onDocumentUpdated(
  { document: 'users/{userId}' },
  (event) => { ... }
)
```

4. **Delete Old Functions:**
```bash
# Delete v1 functions before deploying v2
firebase functions:delete oldFunctionName --project=PROJECT_ID --force
```

## Environment Management

### Multi-Environment Setup

**Development Environment (ee-dev-apps):**
- Service Account: `admin-service-account-dev.json`
- Environment File: `.env.dev`
- Web Config: Switch to dev configuration

**Production Environment (ee-prod-apps):**
- Service Account: `admin-service-account-prod.json`
- Environment File: `.env.prod`
- Web Config: Switch to prod configuration

### Environment-Specific Variables

```bash
# .env.dev
PROJECT_ENV=dev
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com

# .env.prod
PROJECT_ENV=prod
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-key
```

## Success Story: October 2025 Deployment

**Before Fixes:**
- ❌ Container health check failures
- ❌ Module loading errors
- ❌ Reserved environment variable conflicts
- ❌ Trigger type mismatches
- ❌ Incomplete deployment process

**After Systematic Fixes:**
- ✅ All functions deploy successfully
- ✅ Correct trigger types (document.updated, callable)
- ✅ Web environment synchronization
- ✅ Shared types integration
- ✅ Clean deployment process

**Final Result:**
```
✔ functions[checkUserClaims(europe-west1)] Successful create operation.
✔ functions[onBusinessVerificationStatusChange(europe-west1)] Successful update operation.
✔ functions[setAdminsClaims(europe-west1)] Successful create operation.
✔ functions[onUserDocumentUpdate(europe-west1)] Successful create operation.

✔ Deploy complete!
```

## Maintenance and Best Practices

1. **Regular Updates**: Keep Firebase Functions SDK updated
2. **Consistent Environments**: Ensure dev/prod parity
3. **Proper Testing**: Test functions locally before deployment
4. **Monitoring**: Set up Cloud Run monitoring and alerting
5. **Documentation**: Keep deployment scripts and configs documented

**Last Updated:** October 5, 2025  
**Successful Deployment Reference:** ee-dev-apps (All functions operational)