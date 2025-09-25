# Business Verification Email Notifications

This document describes the automatic email notification system for business verification status changes.

## Overview

The system automatically sends email notifications to business owners when their business verification status changes. This is implemented as a Firebase Function that listens to Firestore document updates on the `businesses` collection.

## Trigger Function

**File:** `functions/src/triggers/business-verification-trigger.ts`

**Function Name:** `onBusinessVerificationStatusChange`

**Trigger:** Firestore document update on `businesses/{businessId}`

### What it does:

1. **Monitors Changes**: Listens to all business document updates
2. **Filters Status Changes**: Only processes updates where `verification.status` actually changed
3. **Identifies Owner**: Retrieves the business owner's information using `ownerId` field
4. **Sends Appropriate Email**: Sends different emails based on the new verification status

## Email Types

### 1. Pending Review Email

**Status Trigger:** `UNVERIFIED` or `REJECTED` → `PENDING`

**When sent:**

- User completes business setup and submits documents
- User resubmits after rejection
- Admin clears rejection status

**Content:** Informs the owner that their business application is under review with estimated timeline.

### 2. Approval Email

**Status Trigger:** `PENDING` → `VERIFIED`

**When sent:** Admin approves the business application

**Content:** Congratulates the owner and provides information about available features.

### 3. Rejection Email

**Status Trigger:** `PENDING` → `REJECTED`

**When sent:** Admin rejects the business application

**Content:** Explains the rejection with reason (if provided) and next steps.

## Implementation Details

### Function Structure

```typescript
export const onBusinessVerificationStatusChange = onDocumentUpdated(
  'businesses/{businessId}',
  async event => {
    // Extract before/after data
    // Compare verification status
    // Get owner information
    // Send appropriate email
  }
)
```

### Status Change Detection

```typescript
const beforeStatus =
  beforeData.verification?.status || BusinessVerificationStatus.UNVERIFIED
const afterStatus =
  afterData.verification?.status || BusinessVerificationStatus.UNVERIFIED

// Only proceed if verification status actually changed
if (beforeStatus === afterStatus) {
  return // Exit early - no email needed
}
```

### Owner Information Retrieval

```typescript
// Get owner's user information
const ownerUser = await auth.getUser(ownerId)
const ownerEmail = ownerUser.email
const ownerName = ownerUser.displayName || ownerEmail.split('@')[0]
```

### Email Service Integration

The function uses the existing email service (`utils/email.service.ts`) with these methods:

- `sendBusinessApprovalEmail()`
- `sendBusinessRejectionEmail()`
- `sendEmail()` (for custom pending email)

## Status Change Scenarios

| From Status  | To Status  | Trigger Action                | Email Sent     |
| ------------ | ---------- | ----------------------------- | -------------- |
| `UNVERIFIED` | `PENDING`  | User submits documents        | Pending Review |
| `PENDING`    | `VERIFIED` | Admin approves                | Approval       |
| `PENDING`    | `REJECTED` | Admin rejects                 | Rejection      |
| `REJECTED`   | `PENDING`  | User resubmits / Admin clears | Pending Review |

## Testing

### Test Script

**File:** `functions/src/tests/test-business-verification-emails.ts`

**Commands:**

```bash
cd functions
npm run test-emails approval   # Test approval email
npm run test-emails rejection  # Test rejection email
npm run test-emails pending    # Test pending email
npm run test-emails all        # Test all email types
npm run test-emails scenarios  # Show status change scenarios
```

### Manual Testing Steps

1. **Configure Test Email:**

   ```typescript
   const TEST_CONFIG = {
     email: 'your-test@email.com', // Update this
     businessName: 'Test Business Ltd.',
     ownerName: 'John Doe',
   }
   ```

2. **Set Up Email Service:**
   - Ensure `.env` file has email configuration
   - Verify SMTP settings are correct

3. **Run Tests:**
   ```bash
   npm run test-emails all
   ```

### Firebase Emulator Testing

To test with the Firebase emulator:

1. **Start Emulator:**

   ```bash
   firebase emulators:start --only firestore,functions
   ```

2. **Trigger Function:**
   - Update a business document in the emulator UI
   - Change the `verification.status` field
   - Check function logs for execution

## Deployment

### Build and Deploy

```bash
cd functions
npm run build
firebase deploy --only functions:onBusinessVerificationStatusChange
```

### Environment Variables

Ensure these are set in Firebase Functions:

```bash
firebase functions:config:set email.smtp_host="smtp.gmail.com"
firebase functions:config:set email.smtp_port="587"
firebase functions:config:set email.smtp_user="your-email@gmail.com"
firebase functions:config:set email.smtp_pass="your-app-password"
```

## Monitoring and Logs

### Function Logs

```bash
firebase functions:log --only onBusinessVerificationStatusChange
```

### Success Log Example

```
Business verification status changed: pending → verified
businessId: "abc123"
businessName: "Example Business"
Email sent successfully
messageId: "xyz789"
```

### Error Handling

The function includes comprehensive error handling:

- **Missing Data**: Logs warnings for missing before/after data
- **User Not Found**: Logs errors if owner user doesn't exist
- **Email Failures**: Logs email service errors with context
- **Exception Handling**: Catches and logs all unexpected errors

## Email Templates

### Template Structure

All emails follow a consistent structure:

- **Header**: Branded header with status icon
- **Content**: Personalized message with business name
- **Action Items**: Clear next steps for the user
- **Footer**: Support contact information

### Localization

Currently templates are in Turkish. To add other languages:

1. Create language-specific template functions
2. Detect user's preferred language from user document
3. Call appropriate template based on language preference

## Security Considerations

1. **Authentication**: Function runs with admin privileges
2. **Data Access**: Only accesses necessary user/business data
3. **Email Content**: No sensitive data included in email templates
4. **Error Logging**: Sensitive information is not logged

## Future Enhancements

1. **Email Preferences**: Allow users to opt-out of certain notifications
2. **Rich Templates**: Add more visual elements to email templates
3. **SMS Notifications**: Add SMS notifications as alternative/backup
4. **Batch Processing**: Handle bulk status changes efficiently
5. **Analytics**: Track email delivery and open rates
6. **Retry Logic**: Implement retry mechanism for failed email sends

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check email service configuration
   - Verify SMTP credentials
   - Check Firebase Functions logs

2. **Function Not Triggering**
   - Verify function is deployed
   - Check Firestore security rules
   - Ensure business document structure matches expected format

3. **Wrong Email Content**
   - Verify business data contains required fields
   - Check template logic for status-specific content
   - Review rejection reason extraction logic

### Debug Commands

```bash
# Check function deployment
firebase functions:list

# View recent logs
firebase functions:log --limit 50

# Test email service directly
npm run test-emails approval
```
