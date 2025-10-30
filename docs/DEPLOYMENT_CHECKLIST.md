# 🚀 Quick Deployment Checklist

Use this checklist before deploying to Firebase App Hosting to ensure success.

## ✅ Pre-Deployment Checklist

### 1. Firebase Functions Deployment

- [ ] All imports use relative paths (`../shared-generated`)
- [ ] No reserved environment variables in `.env` files
- [ ] Shared types built: `npm run build:shared:functions`
- [ ] Web environment matches target: `./web/scripts/switch-to-dev.sh`
- [ ] Service account files present for target environment
- [ ] Functions build locally: `cd functions && npm run build`

### 2. Web App Dependencies & Lockfile

- [ ] All new dependencies added to `web/package.json`
- [ ] Standalone lockfile updated: `cd web && pnpm install --ignore-workspace`
- [ ] Verify formidable in lockfile: `grep "formidable" web/pnpm-lock.yaml`
- [ ] No workspace references in `web/pnpm-lock.yaml`

### 3. Shared Types

- [ ] Built shared types: `npm run build:shared:web`
- [ ] Verify copied: `ls web/src/shared-generated/`
- [ ] No TypeScript errors: `cd web && npm run type:check`

### 3. Local Build Test

- [ ] Clean build succeeds: `cd web && npm run build`
- [ ] Firebase Auth warnings are normal (expected during SSR)
- [ ] No compilation errors
- [ ] All pages generated successfully

### 4. Firebase Auth Configuration

- [ ] Client-side only initialization in `firebase-auth-config.ts`
- [ ] Auth service handles null auth instances
- [ ] Components use dynamic imports for auth
- [ ] Dual authentication in API routes (session + ID token)

### 5. Environment Variables

- [ ] All required env vars in `web/apphosting.yaml`
- [ ] Firebase config variables set correctly
- [ ] API endpoints point to correct URLs
- [ ] No sensitive data in environment config

## 🔥 Deployment Commands

### Firebase Functions

```bash
# Deploy functions to dev environment
cd functions && ./deploy-dev.sh

# Deploy functions to prod environment  
cd functions && ./deploy-prod.sh
```

### Web App (Firebase App Hosting)

```bash
# From project root
./deploy-apphosting.sh

# Select target:
# 1) Test Environment (ee-next-test)
# 2) Live Environment (electro-eksper-next)
```

## 📊 Success Indicators

### Firebase Functions Deployment
- ✅ Web environment switched successfully
- ✅ Shared types built and copied
- ✅ Functions source uploaded successfully
- ✅ All functions show "Successful create/update operation"
- ✅ Functions list shows correct trigger types

### Web App Deployment
- ✅ "Source code uploaded" - Upload completed
- ✅ Build starts without lockfile errors
- ✅ "DONE" status in build logs
- ✅ Container successfully pushed
- ✅ No ERR_PNPM_OUTDATED_LOCKFILE errors

## 🔍 Quick Debugging

If deployment fails:

1. **Check build logs:**

   ```bash
   gcloud logging read 'resource.type="build" timestamp>"2025-09-22T10:00:00Z"' --limit=10 --project=elektro-ekspert-apps
   ```

2. **Common fixes:**
   - Lockfile mismatch → `cd web && rm pnpm-lock.yaml && pnpm install --ignore-workspace`
   - Missing shared types → `npm run build:shared:web`
   - Auth errors → Check client-side only initialization

3. **Test locally first:**
   ```bash
   cd web && npm run build && npm run start
   ```

## 🎯 Environment URLs

After successful deployment:

- **Test Environment**: https://ee-next-test--elektro-ekspert-apps.europe-west4.hosted.app
- **Production Environment**: https://electro-eksper-next--elektro-ekspert-apps.europe-west4.hosted.app

## 📝 Post-Deployment Verification

- [ ] App loads without errors
- [ ] Authentication works (login/logout)
- [ ] Document upload functionality
- [ ] Admin panel accessible
- [ ] API routes responding correctly
- [ ] No console errors in browser

---

**Last Updated:** October 5, 2025  
**Functions Deployment:** `./functions/deploy-dev.sh` | `./functions/deploy-prod.sh`  
**Web Deployment:** `./deploy-apphosting.sh`  
**Detailed Guides:** [Firebase Functions Guide](./FIREBASE_FUNCTIONS_DEPLOYMENT_GUIDE.md) | [Web App Guide](./DEPLOYMENT_GUIDE.md)
