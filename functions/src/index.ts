import { setGlobalOptions } from 'firebase-functions/v2';

// Set global options for all functions BEFORE importing any functions
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

import { onCall } from 'firebase-functions/v2/https';
import userService from './services/user.service';
import { onBusinessVerificationStatusChange, onUserProfileUpdate } from "./triggers";


export const setAdminUserClaims = onCall(async (_) => {
  return userService.setAdminsClaims();
});

// Export the business verification status change trigger
export { onBusinessVerificationStatusChange, onUserProfileUpdate };
