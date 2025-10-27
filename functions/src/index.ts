import { setGlobalOptions } from 'firebase-functions/v2'

// Set global options for all functions BEFORE importing any functions
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 })

import { initMainCategories } from '@functions/category-functions'
import { checkUserClaims, getUserProfile, setAdminsClaims } from './functions/user-functions'
import {
  onBusinessVerificationStatusChange, onUserDocumentUpdate
} from './triggers'

// Export the business verification status change trigger
export {
  checkUserClaims, getUserProfile, initMainCategories, onBusinessVerificationStatusChange, onUserDocumentUpdate, setAdminsClaims
}

