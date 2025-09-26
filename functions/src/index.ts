import { setGlobalOptions } from 'firebase-functions/v2'

// Set global options for all functions BEFORE importing any functions
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 })

import { checkUserClaims, setAdminsClaims } from './services/user.service'
import {
  onBusinessVerificationStatusChange,
  onUserProfileUpdate,
} from './triggers'

// Export the business verification status change trigger
export {
  checkUserClaims,
  onBusinessVerificationStatusChange,
  onUserProfileUpdate,
  setAdminsClaims
}

