# Environment-Specific Deployment Guide

This project supports two separate Firebase environments:
- **Development**: `ee-dev-apps` project
- **Production**: `ee-prod-apps` project

## Firebase Project Configurations

### Development Environment (ee-dev-apps)
```javascript
{
  apiKey: "AIzaSyAvWTu0V1AZ26UdwZgl2U1lGKLTFH6XC-s",
  authDomain: "ee-dev-apps.firebaseapp.com",
  projectId: "ee-dev-apps",
  storageBucket: "ee-dev-apps.firebasestorage.app",
  messagingSenderId: "1048760160741",
  appId: "1:1048760160741:web:854dafd82afdd5b17b9f0c"
}
```

### Production Environment (ee-prod-apps)
```javascript
{
  apiKey: "AIzaSyD3OOwXGouAHWl2xmePZmmXCXQJFXX4E5o",
  authDomain: "ee-prod-apps.firebaseapp.com",
  projectId: "ee-prod-apps",
  storageBucket: "ee-prod-apps.firebasestorage.app",
  messagingSenderId: "81027156593",
  appId: "1:81027156593:web:9b6718fe1e1ac2355ee9d0"
}
```

## Project Structure

```
├── deploy-full.sh                    # Master deployment script
├── deploy-apphosting.sh             # Web app deployment
├── functions/
│   ├── deploy-with-config.sh        # Functions deployment
│   ├── admin-service-account-dev.json   # Dev admin service account
│   └── admin-service-account-prod.json  # Prod admin service account
└── web/
    ├── .env.dev                     # Dev environment variables
    ├── .env.prod                    # Prod environment variables
    ├── apphosting.dev.yaml          # Dev App Hosting config
    ├── apphosting.live.yaml         # Prod App Hosting config
    ├── scripts/
    │   ├── switch-to-dev.sh         # Switch to dev locally
    │   └── switch-to-prod.sh        # Switch to prod locally
    └── src/lib/
        ├── admin-service-account-dev.json   # Dev admin service account
        └── admin-service-account-prod.json  # Prod admin service account
```

## Quick Start

### 1. Setup Required Files

⚠️ **IMPORTANT**: You need to replace the placeholder production service account files with actual keys:

- `functions/admin-service-account-prod.json`
- `web/src/lib/admin-service-account-prod.json`

Get the actual production service account key from Firebase Console → Project Settings → Service Accounts.

### 2. Local Development

**Switch to Development Environment:**
```bash
cd web
./scripts/switch-to-dev.sh
npm run dev
```

**Switch to Production Environment (for testing):**
```bash
cd web
./scripts/switch-to-prod.sh
npm run dev
```

### 3. Deployment Options

**Deploy Everything (Recommended):**
```bash
./deploy-full.sh dev    # or 'prod'
```

**Deploy Only Web App:**
```bash
./deploy-apphosting.sh dev    # or 'prod'
```

**Deploy Only Functions:**
```bash
cd functions
./deploy-with-config.sh dev    # or 'prod'
```

## Deployment Scripts

### Master Deployment Script (`deploy-full.sh`)
- Coordinates deployment of both web app and functions
- Interactive environment selection
- Selective component deployment (functions, web, or both)

### Web App Deployment (`deploy-apphosting.sh`)
- Deploys to Firebase App Hosting
- Uses environment-specific configurations
- Automatically builds shared types

### Functions Deployment (`functions/deploy-with-config.sh`)
- Deploys Firebase Functions
- Sets environment variables
- Uses environment-specific service accounts

## Environment Variables

### Development (.env.dev)
- Uses `ee-dev-apps` Firebase project
- Development API endpoints
- Dev service accounts

### Production (.env.prod)
- Uses `ee-prod-apps` Firebase project  
- Production API endpoints
- Production service accounts

## Service Account Configuration

### Functions
- **Dev**: `functions/admin-service-account-dev.json`
- **Prod**: `functions/admin-service-account-prod.json`

### Web Application
- **Dev**: `web/src/lib/admin-service-account-dev.json`
- **Prod**: `web/src/lib/admin-service-account-prod.json`

The application automatically selects the correct service account based on the `NEXT_PUBLIC_FIREBASE_PROJECT_ID` environment variable.

## Firebase App Hosting Backends

### Development
- Backend ID: `ee-next-dev-1`
- URL: https://ee-next-dev-1--ee-dev-apps.europe-west4.hosted.app

### Production
- Backend ID: `ee-next-live`
- URL: https://ee-next-live--ee-prod-apps.europe-west4.hosted.app

## Functions Endpoints

### Development
- Base URL: https://europe-west1-ee-dev-apps.cloudfunctions.net

### Production
- Base URL: https://europe-west1-ee-prod-apps.cloudfunctions.net

## Security Notes

1. **Service Account Keys**: Keep production service account keys secure
2. **Environment Variables**: Never commit `.env.local` files
3. **Access Control**: Use Firebase security rules appropriate for each environment
4. **Monitoring**: Monitor both environments separately in Firebase Console

## Troubleshooting

### Common Issues

1. **Service Account Not Found**
   - Ensure the correct service account file exists
   - Check file permissions and paths

2. **Wrong Firebase Project**
   - Verify the selected environment matches your intent
   - Check Firebase CLI project configuration

3. **Build Failures**
   - Ensure shared types are built before deployment
   - Check for missing dependencies

### Environment Verification

To verify which environment you're using:

```bash
# Check web environment
cat web/.env.local | grep FIREBASE_PROJECT_ID

# Check functions environment  
echo $FIREBASE_PROJECT_ENV
```

## Manual Configuration Steps

If you need to set up a new environment:

1. Create Firebase project
2. Generate service account keys
3. Update configuration files
4. Create App Hosting backend
5. Configure environment variables
6. Test deployment

For detailed instructions, see the deployment documentation in `/docs/`.