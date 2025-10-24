// Token Refresh Utility for Admin Access
// Run this in the browser console to force refresh Firebase token

async function forceTokenRefresh() {
  try {
    console.log('🔄 Starting token refresh...');

    // Get Firebase auth instance
    const auth = window.firebase?.auth?.() || window.getAuth?.();

    if (!auth) {
      console.error('❌ Firebase auth not found. Make sure you are logged in.');
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No authenticated user found. Please log in first.');
      return;
    }

    console.log('👤 Current user:', user.email);
    x - terminal - emulator
    // Force refresh the token
    console.log('🔄 Forcing token refresh...');
    const newToken = await user.getIdToken(true);

    console.log('✅ Token refreshed successfully!');

    // Test the new token with admin API
    console.log('🧪 Testing admin API access...');

    const response = await fetch('/api/admin/debug-claims', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Admin API access successful!');
      console.log('🔍 Claims:', result.data);

      if (result.data.isAdmin) {
        console.log('🎉 You have admin privileges! Refreshing page...');
        window.location.reload();
      } else {
        console.error('❌ Admin claims not found in token. Claims:', result.data.customClaims);
      }
    } else {
      console.error('❌ Admin API access failed:', result);
    }

  } catch (error) {
    console.error('❌ Error during token refresh:', error);
  }
}

// Also export for manual use
window.forceTokenRefresh = forceTokenRefresh;

console.log('🔧 Token refresh utility loaded. Run forceTokenRefresh() to refresh your admin token.');