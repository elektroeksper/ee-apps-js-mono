# Backend Configuration Reference

## Current Setup

After removing the `electro-eksper-next` Firebase app, the configuration has been simplified to use a single Firebase app for both environments.

### Firebase App Configuration

**Single Firebase App**: `electro-eksper-app`

- **App ID**: `1:494385427557:web:27ee4a7bd96966c0e5028c`
- **Measurement ID**: `G-NS7WV19N5L`
- **Used for**: Both TEST and LIVE environments

### Backend Configuration

#### TEST Environment

- **Backend Name**: `ee-next-test` ✅ (exists)
- **URL**: `https://ee-next-test--elektro-ekspert-apps.europe-west4.hosted.app`
- **Status**: Active and deployed

#### LIVE Environment

- **Backend Name**: `ee-next-live` ✅ (exists)
- **URL**: `https://ee-next-live--elektro-ekspert-apps.europe-west4.hosted.app`
- **Status**: Ready for deployment

## Backend Creation Complete

Both backends have been successfully created using Firebase CLI:

```bash
firebase apphosting:backends:create --backend ee-next-live --app 1:494385427557:web:27ee4a7bd96966c0e5028c --primary-region europe-west4 --root-dir web --non-interactive --project elektro-ekspert-apps
```

**Key insight**: Using `--non-interactive` flag bypasses GitHub integration requirement and creates local-deployment-ready backends.

## Deployment Process

The deployment script (`./deploy-apphosting.sh`) now:

1. **Updates configuration files** dynamically based on target environment:
   - `apphosting.yaml`: Environment URLs
   - `firebase.json`: Backend ID
2. **Deploys to correct backend** using local source
3. **Restores original configuration** after deployment

### Usage

```bash
# Interactive mode
./deploy-apphosting.sh

# Direct deployment
./deploy-apphosting.sh test   # Deploy to TEST environment
./deploy-apphosting.sh live   # Deploy to LIVE environment
```

Both backends are ready and fully configured for local deployments!

## Environment URL Mapping

- **TEST**: All URLs point to `ee-next-test--elektro-ekspert-apps.europe-west4.hosted.app`
- **LIVE**: All URLs point to `ee-next-live--elektro-ekspert-apps.europe-west4.hosted.app`

## Firebase App Usage

Since we're using a single Firebase app (`electro-eksper-app`) for both environments:

- ✅ **Simplified configuration management**
- ✅ **Same authentication and Firestore access**
- ✅ **Consistent Firebase project settings**
- ✅ **No app-specific configuration switching needed**

The deployment script only updates URLs and backend targeting, not Firebase app configuration.
