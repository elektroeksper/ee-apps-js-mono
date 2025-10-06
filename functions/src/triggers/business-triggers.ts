/**
 * Business Verification Email Notification Trigger
 * Listens to business document updates and sends email notifications
 * when verification status changes
 */

import { BusinessVerificationStatus, IBusiness } from '@shared'
import { logger } from 'firebase-functions/v2'
import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import {
  sendBusinessApprovalEmail,
  sendBusinessRejectionEmail,
  sendEmail,
} from '../utils/email-utils'
import { auth } from '../utils/firebase-admin'

/**
 * Firebase Function that triggers on business document updates
 * Filters for verification.status changes only and sends appropriate emails
 */
export const onBusinessVerificationStatusChange = onDocumentUpdated(
  {
    document: 'businesses/{businessId}',
    database: 'native-db', // Use the Native mode database
  },
  async event => {
    const beforeData = event.data?.before?.data() as IBusiness | undefined
    const afterData = event.data?.after?.data() as IBusiness | undefined

    if (!beforeData || !afterData) {
      logger.warn('Missing before or after data in business update trigger')
      return
    }

    const businessId = event.params.businessId
    const businessName = afterData.businessName
    const ownerId = afterData.ownerId

    // Extract verification statuses
    const beforeStatus =
      beforeData.verification?.status || BusinessVerificationStatus.UNVERIFIED
    const afterStatus =
      afterData.verification?.status || BusinessVerificationStatus.UNVERIFIED

    // Only proceed if verification status actually changed
    if (beforeStatus === afterStatus) {
      logger.info(`No verification status change for business ${businessId}`, {
        businessId,
        businessName,
        status: afterStatus,
      })
      return
    }

    logger.info(
      `Business verification status changed: ${beforeStatus} → ${afterStatus}`,
      {
        businessId,
        businessName,
        ownerId,
        beforeStatus,
        afterStatus,
      }
    )

    try {
      // Get owner's user information
      const ownerUser = await auth.getUser(ownerId)

      if (!ownerUser.email) {
        logger.error(`Owner user ${ownerId} does not have an email address`, {
          businessId,
          ownerId,
        })
        return
      }

      const ownerEmail = ownerUser.email
      const ownerName = ownerUser.displayName || ownerEmail.split('@')[0]

      logger.info(`Preparing to send email notification`, {
        businessId,
        businessName,
        ownerEmail,
        ownerName,
        newStatus: afterStatus,
      })

      // Send appropriate email based on new status
      let emailResult

      switch (afterStatus) {
        case BusinessVerificationStatus.VERIFIED:
          logger.info(`Sending approval email for business ${businessId}`)
          emailResult = await sendBusinessApprovalEmail(
            ownerEmail,
            businessName,
            ownerName
          )
          break

        case BusinessVerificationStatus.REJECTED: {
          // Get the latest rejection reason from verification history
          const latestRejection = afterData.verification.history
            ?.slice()
            .reverse()
            .find(entry => entry.rejectedAt && entry.rejectionReason)

          const rejectionReason = latestRejection?.rejectionReason || undefined

          logger.info(`Sending rejection email for business ${businessId}`, {
            hasReason: !!rejectionReason,
            reasonLength: rejectionReason?.length || 0,
          })

          emailResult = await sendBusinessRejectionEmail(
            ownerEmail,
            businessName,
            ownerName,
            rejectionReason
          )
          break
        }

        case BusinessVerificationStatus.PENDING: {
          // Send pending notification email
          logger.info(`Sending pending review email for business ${businessId}`)
          emailResult = await sendBusinessPendingEmail(
            ownerEmail,
            businessName,
            ownerName
          )
          break
        }

        case BusinessVerificationStatus.UNVERIFIED:
          // Typically this shouldn't happen in normal flow, but we can log it
          logger.info(
            `Business ${businessId} status changed to UNVERIFIED - no email sent`
          )
          return

        default:
          logger.warn(`Unknown verification status: ${afterStatus}`, {
            businessId,
            afterStatus,
          })
          return
      }

      // Log email sending result
      if (emailResult?.success) {
        logger.info(
          `Email sent successfully for business verification status change`,
          {
            businessId,
            businessName,
            ownerEmail,
            newStatus: afterStatus,
            messageId: emailResult.messageId,
          }
        )
      } else {
        logger.error(
          `Failed to send email for business verification status change`,
          {
            businessId,
            businessName,
            ownerEmail,
            newStatus: afterStatus,
            error: emailResult?.error,
          }
        )
      }
    } catch (error) {
      logger.error(`Error in business verification email trigger`, {
        businessId,
        businessName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    }
  }
)

/**
 * Send pending review notification email
 */
async function sendBusinessPendingEmail(
  email: string,
  businessName: string,
  ownerName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
          <h2>Merhaba ${ownerName},</h2>
          <p><strong>${businessName}</strong> işletmeniz için yaptığınız başvuru inceleme sürecine alındı!</p>
          
          <div class="timeline">
            <strong>🕐 İnceleme Süreci:</strong><br>
            • Belgeleriniz uzman ekibimiz tarafından değerlendirilecek<br>
            • İşletme bilgileriniz doğrulanacak<br>
            • Sonuç e-posta ile bildirilecek<br>
            • Ortalama süre: 1-3 iş günü
          </div>

          <p><strong>Bu süreçte neler yapabilirsiniz:</strong></p>
          <ul>
            <li>📱 Eksik belgelerinizi tamamlayabilirsiniz</li>
            <li>✏️ İşletme bilgilerinizi güncelleyebilirsiniz</li>
            <li>📞 Sorularınız için destek ekibimizle iletişime geçebilirsiniz</li>
            <li>📊 Hesap durumunuzu takip edebilirsiniz</li>
          </ul>

          <p>Hesabınıza giriş yaparak güncel durumu takip edebilirsiniz:</p>
          <a href="https://elektroexpert.com/verification" class="button">Durumu Takip Et</a>

          <p>Herhangi bir sorunuz varsa, destek ekibimiz size yardımcı olmaktan memnuniyet duyar.</p>
          
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

  const textTemplate = `
    Merhaba ${ownerName},

    ${businessName} işletmeniz için yaptığınız başvuru inceleme sürecine alındı!

    İnceleme Süreci:
    - Belgeleriniz uzman ekibimiz tarafından değerlendirilecek
    - İşletme bilgileriniz doğrulanacak
    - Sonuç e-posta ile bildirilecek
    - Ortalama süre: 1-3 iş günü

    Bu süreçte neler yapabilirsiniz:
    - Eksik belgelerinizi tamamlayabilirsiniz
    - İşletme bilgilerinizi güncelleyebilirsiniz
    - Sorularınız için destek ekibimizle iletişime geçebilirsiniz
    - Hesap durumunuzu takip edebilirsiniz

    Durumu takip etmek için: https://elektroexpert.com/verification

    Herhangi bir sorunuz varsa, destek@elektroexpert.com adresinden bizimle iletişime geçebilirsiniz.

    Teşekkürler,
    ElektroExpert Ekibi
  `

  return sendEmail({
    to: email,
    subject,
    html: htmlTemplate,
    text: textTemplate,
  })
}
