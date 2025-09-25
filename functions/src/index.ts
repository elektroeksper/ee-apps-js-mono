import { setGlobalOptions } from 'firebase-functions/v2';

// Set global options for all functions BEFORE importing any functions
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

import { onBusinessVerificationStatusChange, onUserProfileUpdate } from "./triggers";

// Export the business verification status change trigger
export { onBusinessVerificationStatusChange, onUserProfileUpdate };
