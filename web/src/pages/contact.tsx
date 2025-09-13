import { useBranding, useContact } from '@/hooks/useContentQueries'
import Link from 'next/link'
import { useState } from 'react'
import {
  FiClock,
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
} from 'react-icons/fi'

const ContactPage = () => {
  const {
    data: contactInfo,
    isLoading: contactLoading,
    error: contactError,
  } = useContact()
  const { data: brandingInfo, isLoading: brandingLoading } = useBranding()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(
    null
  )

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (contactLoading || brandingLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">İletişim bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (contactError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">İletişim bilgileri yüklenemedi</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const defaultContact = {
    phone: '+1 (555) 123-4567',
    email: 'info@electroexpert.com',
    address: '123 Electric Ave, City, State 12345',
    workingHours: 'Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 4:00 PM',
    socialMedia: {
      facebook: undefined,
      instagram: undefined,
      whatsapp: undefined,
    },
    mapUrl: undefined,
  }

  const contact = contactInfo || defaultContact
  const companyName = brandingInfo?.companyName || 'Electro Expert'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {brandingInfo?.logoUrl && (
              <img
                src={brandingInfo.logoUrl}
                alt={brandingInfo.logoAltText}
                className="h-8"
              />
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div
        className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white"
        style={
          brandingInfo?.brandColors
            ? {
                background: `linear-gradient(to right, ${brandingInfo.brandColors.primary}, ${brandingInfo.brandColors.secondary})`,
              }
            : undefined
        }
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Bize Ulaşın</h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            {companyName} ile elektrik ihtiyaçlarınız için iletişime geçin.
            Yardım için buradayız!
          </p>
        </div>
      </div>

      {/* Contact Information & Form */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                İletişime Geçin
              </h2>
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mr-4 flex-shrink-0">
                    <FiPhone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Telefon
                    </h3>
                    <p className="text-gray-600">{contact.phone}</p>
                    <p className="text-sm text-gray-500">
                      Mesai saatleri içinde bizi arayın
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mr-4 flex-shrink-0">
                    <FiMail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      E-posta
                    </h3>
                    <p className="text-gray-600">{contact.email}</p>
                    <p className="text-sm text-gray-500">
                      24 saat içinde yanıtlarız
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mr-4 flex-shrink-0">
                    <FiMapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Adres
                    </h3>
                    <p className="text-gray-600">{contact.address}</p>
                    <p className="text-sm text-gray-500">
                      Ofisimizi veya hizmet bölgemizi ziyaret edin
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg mr-4 flex-shrink-0">
                    <FiClock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Çalışma Saatleri
                    </h3>
                    <p className="text-gray-600">{contact.workingHours}</p>
                    <p className="text-sm text-gray-500">
                      7/24 acil destek mevcuttur
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              {contact.socialMedia &&
                Object.keys(contact.socialMedia).length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Bizi Takip Edin
                    </h3>
                    <div className="flex gap-4">
                      {contact.socialMedia.facebook && (
                        <a
                          href={contact.socialMedia.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiFacebook className="w-5 h-5" />
                        </a>
                      )}
                      {contact.socialMedia.instagram && (
                        <a
                          href={contact.socialMedia.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          <FiInstagram className="w-5 h-5" />
                        </a>
                      )}
                      {contact.socialMedia.whatsapp && (
                        <a
                          href={contact.socialMedia.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FiMessageCircle className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Bize Mesaj Gönderin
              </h2>

              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                  Mesajınız için teşekkürler! En kısa sürede dönüş yapacağız.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                  Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(5xx) xxx xx xx"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    E-posta Adresi *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="eposta@ornek.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Konu *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Size nasıl yardımcı olabiliriz?"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mesaj *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Elektrik ihtiyaçlarınızı veya sorularınızı lütfen açıklayın..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={
                    brandingInfo?.brandColors
                      ? {
                          backgroundColor: brandingInfo.brandColors.primary,
                        }
                      : undefined
                  }
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    'Mesaj Gönder'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      {contact.mapUrl && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Bizi Bulun
              </h2>
              <p className="text-gray-600">
                Konumumuzu veya hizmet bölgemizi ziyaret edin
              </p>
            </div>
            <div className="bg-gray-200 h-96 rounded-lg overflow-hidden">
              <iframe
                src={contact.mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      <div
        className="py-16 bg-red-600 text-white"
        style={
          brandingInfo?.brandColors?.accent
            ? {
                backgroundColor: brandingInfo.brandColors.accent,
              }
            : undefined
        }
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Acil Elektrik Hizmetleri</h2>
          <p className="text-xl text-red-100 mb-6">
            Acil elektrik desteğine mi ihtiyacınız var? 7/24 hizmetinizdeyiz.
          </p>
          <a
            href={`tel:${contact.phone}`}
            className="inline-flex items-center bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            <FiPhone className="w-5 h-5 mr-2" />
            Hemen Ara: {contact.phone}
          </a>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
