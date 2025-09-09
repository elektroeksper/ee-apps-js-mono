# Gmail Setup Instructions

## Setting up Gmail for SMTP

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device
   - Enter "ElektroExpert Functions" as the name
   - Copy the 16-character password

3. **Update your .env file**

   ```bash
   EMAIL_PROVIDER=smtp
   DEFAULT_FROM_EMAIL=noreply@elektroexpert.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

4. **Test locally**

   ```bash
   cd functions
   npm run serve
   ```

5. **Deploy to production**
   ```bash
   firebase deploy --only functions
   ```

## Alternative: Using a dedicated email domain

For production, consider using:

- Your own domain email (info@elektroexpert.com)
- SendGrid for better deliverability
- Amazon SES for cost-effectiveness
