/**
 * Email Service Utility
 * Handles sending emails using different providers (Nodemailer, SendGrid, etc.)
 */

import * as functions from 'firebase-functions'
import * as nodemailer from 'nodemailer'

// Email options interface
export interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    path?: string
    content?: Buffer | string
    contentType?: string
  }>
}

// Email service configuration
interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'gmail'
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  sendgrid?: {
    apiKey: string
  }
  gmail?: {
    clientId: string
    clientSecret: string
    refreshToken: string
    accessToken?: string
  }
  defaultFrom: string
}

// Default email configuration - uses environment variables only (Firebase Functions v2)
const getEmailConfig = (): EmailConfig => {
  // Firebase Functions v2 only supports environment variables, not functions.config()
  const provider = (process.env.EMAIL_PROVIDER || 'smtp') as
    | 'smtp'
    | 'sendgrid'
    | 'gmail'

  // Log configuration source for debugging
  functions.logger.info('Email configuration loaded', {
    provider,
    hasEnvConfig: !!process.env.SMTP_USER,
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT || '587',
  })

  return {
    provider,
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    gmail: {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      refreshToken: process.env.GMAIL_REFRESH_TOKEN || '',
      accessToken: process.env.GMAIL_ACCESS_TOKEN,
    },
    defaultFrom: process.env.DEFAULT_FROM_EMAIL || 'noreply@elektroeksper.com',
  }
}

// Create transporter based on configuration
const createTransporter = async () => {
  const config = getEmailConfig()

  switch (config.provider) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: config.smtp?.auth.user,
          clientId: config.gmail?.clientId,
          clientSecret: config.gmail?.clientSecret,
          refreshToken: config.gmail?.refreshToken,
          accessToken: config.gmail?.accessToken,
        },
      })

    case 'sendgrid':
      // For SendGrid, we'd use their SDK, but for now we'll use SMTP
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: config.sendgrid?.apiKey,
        },
      })

    case 'smtp':
    default:
      return nodemailer.createTransport({
        host: config.smtp?.host,
        port: config.smtp?.port,
        secure: config.smtp?.secure,
        auth: {
          user: config.smtp?.auth.user,
          pass: config.smtp?.auth.pass,
        },
      })
  }
}

// Send email function
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getEmailConfig()

    // Validate email configuration
    if (
      config.provider === 'smtp' &&
      (!config.smtp?.auth.user || !config.smtp?.auth.pass)
    ) {
      const error =
        'SMTP configuration is incomplete. Please set SMTP_USER and SMTP_PASS environment variables.'
      functions.logger.error('Email configuration error', {
        error,
        config: {
          user: !!config.smtp?.auth.user,
          pass: !!config.smtp?.auth.pass,
        },
      })
      return { success: false, error }
    }

    if (config.provider === 'sendgrid' && !config.sendgrid?.apiKey) {
      const error =
        'SendGrid API key is missing. Please set SENDGRID_API_KEY environment variable.'
      functions.logger.error('Email configuration error', { error })
      return { success: false, error }
    }

    // Log email attempt for debugging
    functions.logger.info('Attempting to send email', {
      provider: config.provider,
      to: options.to,
      subject: options.subject,
      hasUser: !!config.smtp?.auth.user,
      hasPass: !!config.smtp?.auth.pass,
      host: config.smtp?.host,
      port: config.smtp?.port,
    })

    const transporter = await createTransporter()

    // Test transporter connection
    try {
      await transporter.verify()
      functions.logger.info('SMTP connection verified successfully')
    } catch (verifyError: any) {
      functions.logger.error('SMTP connection verification failed', {
        error: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
      })
      return {
        success: false,
        error: `SMTP connection failed: ${verifyError.message}`,
      }
    }

    // Prepare email options
    const mailOptions = {
      from: options.from || config.defaultFrom,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      cc: Array.isArray(options.cc) ? options.cc.join(', ') : options.cc,
      bcc: Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc,
      attachments: options.attachments,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    functions.logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject,
    })

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    functions.logger.error('Failed to send email', {
      error: error.message,
      code: error.code,
      command: error.command,
      to: options.to,
      subject: options.subject,
      stack: error.stack,
    })

    return {
      success: false,
      error: `Email sending failed: ${error.message}`,
    }
  }
}

// Email template helpers
export const EmailTemplates = {
  // Business approval email
  businessApprovalEmail: (businessName: string, ownerName: string) => ({
    subject: '🎉 İşletme Hesabınız Onaylandı - ElektroExpert',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>İşletme Hesabı Onaylandı</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">🎉</div>
            <h1>Tebrikler!</h1>
            <p>İşletme hesabınız onaylandı</p>
          </div>
          <div class="content">
            <h2>Merhaba ${ownerName},</h2>
            <p><strong>${businessName}</strong> işletmeniz ElektroExpert platformunda başarıyla onaylandı!</p>
            
            <p>Artık şunları yapabilirsiniz:</p>
            <ul>
              <li>✅ Müşteri taleplerini görüntüleme</li>
              <li>✅ Hizmet teklifleri sunma</li>
              <li>✅ İşletme profilinizi yönetme</li>
              <li>✅ Müşteri değerlendirmelerini takip etme</li>
              <li>✅ Gelişmiş analitik raporlara erişim</li>
            </ul>

            <p>Hemen başlamak için aşağıdaki butona tıklayın:</p>
            <a href="https://elektroeksper.com/home" class="button">Panelime Git</a>

            <p>Herhangi bir sorunuz varsa, destek ekibimizle iletişime geçmekten çekinmeyin.</p>
            
            <p>İyi çalışmalar!<br>
            ElektroExpert Ekibi</p>
          </div>
          <div class="footer">
            <p>Bu e-posta ElektroExpert tarafından gönderilmiştir.<br>
            <a href="mailto:destek@elektroeksper.com">destek@elektroeksper.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Tebrikler ${ownerName}!

      ${businessName} işletmeniz ElektroExpert platformunda başarıyla onaylandı!

      Artık şunları yapabilirsiniz:
      - Müşteri taleplerini görüntüleme
      - Hizmet teklifleri sunma
      - İşletme profilinizi yönetme
      - Müşteri değerlendirmelerini takip etme
      - Gelişmiş analitik raporlara erişim

      Paneline gitmek için: https://elektroeksper.com/home

      Herhangi bir sorunuz varsa, destek@elektroeksper.com adresinden bizimle iletişime geçebilirsiniz.

      İyi çalışmalar!
      ElektroExpert Ekibi
    `,
  }),

  // Business rejection email
  businessRejectionEmail: (
    businessName: string,
    ownerName: string,
    reason?: string
  ) => ({
    subject: '📋 İşletme Hesabı İnceleme Sonucu - ElektroExpert',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>İşletme Hesabı İnceleme Sonucu</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); color: #2d3436; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #0984e3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .info-icon { font-size: 48px; margin-bottom: 20px; }
          .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="info-icon">📋</div>
            <h1>İnceleme Tamamlandı</h1>
            <p>İşletme hesabı inceleme sonucu</p>
          </div>
          <div class="content">
            <h2>Merhaba ${ownerName},</h2>
            <p><strong>${businessName}</strong> işletmeniz için yaptığınız başvuru incelendi.</p>
            
            <p>Maalesef mevcut durumda hesabınızı onaylayamıyoruz.</p>
            
            ${reason
        ? `
            <div class="reason-box">
              <strong>İnceleme Notları:</strong><br>
              ${reason}
            </div>
            `
        : ''
      }

            <p><strong>Sonraki Adımlar:</strong></p>
            <ul>
              <li>📋 Eksik belgeleri tamamlayabilirsiniz</li>
              <li>🔄 Profil bilgilerinizi güncelleyebilirsiniz</li>
              <li>📞 Destek ekibimizle iletişime geçebilirsiniz</li>
              <li>🔃 Düzeltmeleri yaparak tekrar başvurabilirsiniz</li>
            </ul>

            <p>Hesabınıza giriş yaparak belgelerinizi güncellemeye devam edebilirsiniz:</p>
            <a href="https://elektroeksper.com/profile" class="button">Profilimi Düzenle</a>

            <p>Herhangi bir sorunuz varsa, destek ekibimiz size yardımcı olmaktan memnuniyet duyar.</p>
            
            <p>Saygılarımızla,<br>
            ElektroExpert Ekibi</p>
          </div>
          <div class="footer">
            <p>Bu e-posta ElektroExpert tarafından gönderilmiştir.<br>
            <a href="mailto:destek@elektroeksper.com">destek@elektroeksper.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Merhaba ${ownerName},

      ${businessName} işletmeniz için yaptığınız başvuru incelendi.

      Maalesef mevcut durumda hesabınızı onaylayamıyoruz.

      ${reason ? `İnceleme Notları: ${reason}` : ''}

      Sonraki Adımlar:
      - Eksik belgeleri tamamlayabilirsiniz
      - Profil bilgilerinizi güncelleyebilirsiniz
      - Destek ekibimizle iletişime geçebilirsiniz
      - Düzeltmeleri yaparak tekrar başvurabilirsiniz

      Profilinizi düzenlemek için: https://elektroeksper.com/profile

      Herhangi bir sorunuz varsa, destek@elektroeksper.com adresinden bizimle iletişime geçebilirsiniz.

      Saygılarımızla,
      ElektroExpert Ekibi
    `,
  }),
}

// Quick send functions
export const sendBusinessApprovalEmail = async (
  email: string,
  businessName: string,
  ownerName: string
) => {
  const template = EmailTemplates.businessApprovalEmail(businessName, ownerName)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}

export const sendBusinessRejectionEmail = async (
  email: string,
  businessName: string,
  ownerName: string,
  reason?: string
) => {
  const template = EmailTemplates.businessRejectionEmail(
    businessName,
    ownerName,
    reason
  )
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}
