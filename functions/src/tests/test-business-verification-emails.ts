/**
 * Test script for business verification email trigger
 * This script can be used to manually test the email functionality
 */

import { BusinessVerificationStatus } from '@shared'
import {
  sendBusinessApprovalEmail,
  sendBusinessRejectionEmail,
  sendEmail,
} from '../utils/email-utils'

// Test configuration
const TEST_CONFIG = {
  email: 'test@example.com', // Replace with your test email
  businessName: 'Test Business Ltd.',
  ownerName: 'John Doe',
}

/**
 * Test the approval email
 */
async function testApprovalEmail() {
  console.log('🧪 Testing approval email...')

  try {
    const result = await sendBusinessApprovalEmail(
      TEST_CONFIG.email,
      TEST_CONFIG.businessName,
      TEST_CONFIG.ownerName
    )

    if (result.success) {
      console.log('✅ Approval email sent successfully!', {
        messageId: result.messageId,
      })
    } else {
      console.error('❌ Failed to send approval email:', result.error)
    }
  } catch (error) {
    console.error('❌ Error testing approval email:', error)
  }
}

/**
 * Test the rejection email
 */
async function testRejectionEmail() {
  console.log('🧪 Testing rejection email...')

  const rejectionReason =
    'Eksik belgeler: Vergi levhası ve imza sirküleri gerekli.'

  try {
    const result = await sendBusinessRejectionEmail(
      TEST_CONFIG.email,
      TEST_CONFIG.businessName,
      TEST_CONFIG.ownerName,
      rejectionReason
    )

    if (result.success) {
      console.log('✅ Rejection email sent successfully!', {
        messageId: result.messageId,
      })
    } else {
      console.error('❌ Failed to send rejection email:', result.error)
    }
  } catch (error) {
    console.error('❌ Error testing rejection email:', error)
  }
}

/**
 * Test the pending email
 */
async function testPendingEmail() {
  console.log('🧪 Testing pending email...')

  const subject = '📋 İşletme Hesabı İncelemeye Alındı - ElektroExpert'

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>İşletme Hesabı İncelemeye Alındı</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #0984e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .info-icon { font-size: 48px; margin-bottom: 20px; }
        .timeline { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="info-icon">📋</div>
          <h1>İnceleme Başladı!</h1>
          <p>İşletme hesabı başvurunuz değerlendiriliyor</p>
        </div>
        <div class="content">
          <h2>Merhaba ${TEST_CONFIG.ownerName},</h2>
          <p><strong>${TEST_CONFIG.businessName}</strong> işletmeniz için yaptığınız başvuru inceleme sürecine alındı!</p>
          
          <div class="timeline">
            <strong>🕐 İnceleme Süreci:</strong><br>
            • Belgeleriniz uzman ekibimiz tarafından değerlendirilecek<br>
            • İşletme bilgileriniz doğrulanacak<br>
            • Sonuç e-posta ile bildirilecek<br>
            • Ortalama süre: 1-3 iş günü
          </div>

          <p>Bu e-posta test amaçlı gönderilmiştir.</p>
          
          <p>Teşekkürler,<br>
          ElektroExpert Ekibi</p>
        </div>
        <div class="footer">
          <p>Bu e-posta ElektroExpert tarafından gönderilmiştir.<br>
          <a href="mailto:destek@elektroexpert.com">destek@elektroexpert.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await sendEmail({
      to: TEST_CONFIG.email,
      subject,
      html: htmlTemplate,
      text: `Test pending email for ${TEST_CONFIG.businessName} sent to ${TEST_CONFIG.ownerName}`,
    })

    if (result.success) {
      console.log('✅ Pending email sent successfully!', {
        messageId: result.messageId,
      })
    } else {
      console.error('❌ Failed to send pending email:', result.error)
    }
  } catch (error) {
    console.error('❌ Error testing pending email:', error)
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting business verification email tests...\n')

  // Test each email type
  await testApprovalEmail()
  console.log('')

  await testRejectionEmail()
  console.log('')

  await testPendingEmail()

  console.log('\n✨ All tests completed!')
}

/**
 * Simulate business verification status changes
 */
function simulateStatusChanges() {
  console.log('📝 Business Verification Status Change Scenarios:\n')

  const scenarios = [
    {
      from: BusinessVerificationStatus.UNVERIFIED,
      to: BusinessVerificationStatus.PENDING,
      action: 'User completes business setup and submits documents',
      emailExpected: 'Pending Review Email',
    },
    {
      from: BusinessVerificationStatus.PENDING,
      to: BusinessVerificationStatus.VERIFIED,
      action: 'Admin approves the business',
      emailExpected: 'Approval Email',
    },
    {
      from: BusinessVerificationStatus.PENDING,
      to: BusinessVerificationStatus.REJECTED,
      action: 'Admin rejects the business (with reason)',
      emailExpected: 'Rejection Email',
    },
    {
      from: BusinessVerificationStatus.REJECTED,
      to: BusinessVerificationStatus.PENDING,
      action: 'Admin clears rejection or user resubmits',
      emailExpected: 'Pending Review Email',
    },
  ]

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.from} → ${scenario.to}`)
    console.log(`   Action: ${scenario.action}`)
    console.log(`   Email: ${scenario.emailExpected}\n`)
  })
}

// Main execution
if (require.main === module) {
  const command = process.argv[2]

  switch (command) {
    case 'approval':
      testApprovalEmail()
      break
    case 'rejection':
      testRejectionEmail()
      break
    case 'pending':
      testPendingEmail()
      break
    case 'all':
      runAllTests()
      break
    case 'scenarios':
      simulateStatusChanges()
      break
    default:
      console.log('📧 Business Verification Email Test Script\n')
      console.log('Usage:')
      console.log('  npm run test-emails approval   - Test approval email')
      console.log('  npm run test-emails rejection   - Test rejection email')
      console.log('  npm run test-emails pending     - Test pending email')
      console.log('  npm run test-emails all         - Test all emails')
      console.log(
        '  npm run test-emails scenarios   - Show status change scenarios'
      )
      console.log('\nBefore running tests, make sure to:')
      console.log('1. Update TEST_CONFIG.email with your test email address')
      console.log('2. Configure your email service settings in .env')
      break
  }
}

export {
  runAllTests,
  simulateStatusChanges,
  testApprovalEmail,
  testPendingEmail,
  testRejectionEmail
}

