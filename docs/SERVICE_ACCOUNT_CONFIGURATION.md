# Service Account Configuration Guide

## Overview

This document explains how Firebase Admin service accounts are configured across different environments to ensure proper security and functionality.

## Service Account Files Location

Service account JSON files are located in the `/functions` directory:

- `functions/admin-service-account-dev.json` - Development/Test credentials
- `functions/admin-service-account-prod.json` - Production credentials

## Environment Configuration

### Development Environment (`ee-next-dev-1`)
- **Project**: `ee-dev-apps`
- **Service Account**: `admin-service-account-dev.json`
- **Backend ID**: `ee-next-dev-1`
- **URL**: https://ee-next-dev-1--ee-dev-apps.europe-west4.hosted.app
- **Configuration File**: `web/apphosting.dev.yaml`
- **Purpose**: Local development and feature testing

### Test Environment (`ee-next-test`)
- **Project**: `ee-dev-apps` ⚠️ **Uses dev project for testing**
- **Service Account**: `admin-service-account-dev.json`
- **Backend ID**: `ee-next-test`
- **URL**: https://ee-next-test--ee-prod-apps.europe-west4.hosted.app
- **Configuration File**: `web/apphosting.test.yaml`
- **Purpose**: Pre-production testing with dev data

### Live Environment (`ee-next-live`)
- **Project**: `ee-prod-apps`
- **Service Account**: `admin-service-account-prod.json`
- **Backend ID**: `ee-next-live`
- **URL**: https://ee-next-live--ee-prod-apps.europe-west4.hosted.app
- **Configuration File**: `web/apphosting.live.yaml`
- **Purpose**: Production environment with live data

## Service Account Selection Logic

The Firebase Admin SDK automatically selects the correct service account based on the `NEXT_PUBLIC_FIREBASE_PROJECT_ID` environment variable:

```typescript
// In web/src/lib/firebase-admin.ts
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const isDev = projectId === 'ee-dev-apps'
const env = isDev ? 'dev' : 'prod'

// Loads: admin-service-account-${env}.json
// - ee-dev-apps  → admin-service-account-dev.json
// - ee-prod-apps → admin-service-account-prod.json
```

## Deployment Commands

### Deploy to Development Environment
```bash
./deploy-apphosting.sh dev
```
- Uses `admin-service-account-dev.json`
- Deploys to `ee-dev-apps` project
- Service account is automatically copied to `web/functions/` during deployment

### Deploy to Test Environment
```bash
./deploy-apphosting.sh test
```
- Uses `admin-service-account-dev.json` (shares dev data)
- Deploys to `ee-dev-apps` project
- Service account is automatically copied to `web/functions/` during deployment

### Deploy to Live/Production Environment
```bash
./deploy-apphosting.sh live
```
- Uses `admin-service-account-prod.json`
- Deploys to `ee-prod-apps` project
- Service account is automatically copied to `web/functions/` during deployment
- **Requires confirmation**

## Important Notes

### Why Test Uses Dev Credentials

The test environment is configured to use `ee-dev-apps` project credentials because:

1. **Data Isolation**: Test environment should use test/dev data, not production data
2. **Safety**: Prevents accidental modifications to production data during testing
3. **Cost**: Avoids production resource usage for testing purposes

### Service Account Permissions

Both service accounts need the following permissions:

- **Firebase Admin SDK Admin** - Full Firebase access
- **Storage Admin** - For signed URLs and document uploads
- **Firestore Admin** - For database operations
- **Authentication Admin** - For user management

### Local Development

For local development, the service account files are loaded from:
```
/functions/admin-service-account-dev.json
```

The path resolution works as follows:
1. Current working directory is `/web`
2. Go up one level: `..` → project root
3. Enter functions directory: `functions/`
4. Load: `admin-service-account-${env}.json`

### Firebase App Hosting Deployment

During Firebase App Hosting deployment, service accounts are NOT bundled. Instead:

1. The build runs in Cloud Build
2. Cloud Build has access to the project's default service account
3. The deployed app uses Workload Identity Federation
4. Service account files are only needed for:
   - Local development
   - Generating signed URLs
   - Admin operations requiring service account credentials

## Troubleshooting

### "Error uploading documents: Error: Permission iam.serviceAccounts.signBlob denied"

**Problem**: Service account lacks permissions to generate signed URLs for Storage.

**Solution**: Grant the necessary IAM roles:

```bash
# Grant Service Account Token Creator role (for self-signing)
gcloud iam service-accounts add-iam-policy-binding firebase-admin@ee-dev-apps.iam.gserviceaccount.com \
  --member="serviceAccount:firebase-admin@ee-dev-apps.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=ee-dev-apps

# Grant Storage Admin role (for file uploads)
gcloud projects add-iam-policy-binding ee-dev-apps \
  --member="serviceAccount:firebase-admin@ee-dev-apps.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

For production:
```bash
# Grant Service Account Token Creator role
gcloud iam service-accounts add-iam-policy-binding firebase-admin@ee-prod-apps.iam.gserviceaccount.com \
  --member="serviceAccount:firebase-admin@ee-prod-apps.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project=ee-prod-apps

# Grant Storage Admin role
gcloud projects add-iam-policy-binding ee-prod-apps \
  --member="serviceAccount:firebase-admin@ee-prod-apps.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### "Cannot sign data without `client_email`" Error

This error occurs when:
- Service account file is not found
- Falls back to Application Default Credentials (ADC)
- ADC doesn't have `client_email` field needed for signed URLs

**Solution**: Ensure service account file exists at the correct path

### Wrong Service Account Loaded

Check the console logs for:
```
✅ Firebase Admin initialized with [dev|prod] service account for [project-id]
✅ Using service account: firebase-admin@[project-id].iam.gserviceaccount.com
```

If wrong account is loaded:
1. Check `NEXT_PUBLIC_FIREBASE_PROJECT_ID` environment variable
2. Verify correct `apphosting.yaml` file is being used
3. Restart the development server

### Service Account File Not Found

If you see:
```
❌ Service account file does not exist: [path]
```

Verify:
1. File exists in `/functions` directory
2. File name matches: `admin-service-account-dev.json` or `admin-service-account-prod.json`
3. Path resolution is correct from web directory

## Security Best Practices

1. **Never commit service account files to version control**
   - Already in `.gitignore`
   - Keep files local or in secure secret management

2. **Rotate service account keys regularly**
   - Every 90 days recommended
   - Update both dev and prod files

3. **Use principle of least privilege**
   - Grant only necessary permissions
   - Review permissions regularly

4. **Monitor service account usage**
   - Check Firebase console for unauthorized access
   - Set up alerts for suspicious activity

## Related Documentation

- [Firebase Admin SDK Setup](../functions/ADMIN_SERVICE_ACCOUNT_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Firebase Configuration](./BACKEND_CONFIGURATION.md)
