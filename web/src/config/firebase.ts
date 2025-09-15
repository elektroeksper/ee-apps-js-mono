import app, { getAnalytics } from "@/shared-generated/configs/firebase";

// Initialize Analytics (only in browser environment)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
