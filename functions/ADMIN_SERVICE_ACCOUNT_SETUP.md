# Firebase Admin Service Account Setup

## For Local Development Only

1. **Download Service Account Key:**
   - Go to: https://console.firebase.google.com/project/elektro-ekspert-apps/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Save as `functions/admin-service-account.json`

2. **⚠️ SECURITY WARNING:**
   - This file contains sensitive credentials
   - Never commit to git
   - Never share publicly
   - Only for local development/testing

3. **Usage:**
   - Admin utility scripts (check-admin-claims.js)
   - Local Firebase Admin operations
   - NOT needed for deployed Firebase Functions

## File Structure (admin-service-account.json):

```json
{
  "type": "service_account",
  "project_id": "elektro-ekspert-apps",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

## Alternative: Environment Variable

Instead of JSON file, you can set:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/admin-service-account.json"
```
