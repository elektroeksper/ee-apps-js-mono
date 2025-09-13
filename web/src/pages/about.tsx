import { useAbout, useBranding, useContact } from '@/hooks/useContentQueries'
import Link from 'next/link'
import { FiAward, FiCalendar, FiCheckCircle, FiUsers } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'

// Component to render markdown content with proper styling
const MarkdownContent = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-gray max-w-none prose-lg">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="text-gray-600 leading-relaxed mb-4">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-gray-600">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              {children}
            </h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-300 pl-6 italic text-gray-700 my-4 bg-blue-50 py-2">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

const AboutPage = () => {
  const {
    data: aboutInfo,
    isLoading: aboutLoading,
    error: aboutError,
  } = useAbout()
  const { data: brandingInfo, isLoading: brandingLoading } = useBranding()
  const { data: contactInfo } = useContact()

  if (aboutLoading || brandingLoading) {
    return (
      <div className="min-h-screen bg-gradient-services flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading about information...</p>
        </div>
      </div>
    )
  }

  if (aboutError) {
    return (
      <div className="min-h-screen bg-gradient-services flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load about information</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const companyName = brandingInfo?.companyName || 'Electro Expert'

  return (
    <div className="min-h-screen bg-gradient-services">
      {/* Hero Section */}
      <div className="py-16 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-overlay"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">Hakkımızda</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            ElectroExpert olarak elektrik alanında güvenilir çözümler sunuyoruz.
          </p>
        </div>
      </div>

      {/* About Content */}
      <div className="py-16 bg-gradient-section-light">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
            {aboutInfo?.mdContent ? (
              <MarkdownContent content={aboutInfo.mdContent} />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4 text-4xl">📄</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  İçerik Bulunamadı
                </h3>
                <p className="text-gray-600">
                  Hakkımızda sayfası içeriği henüz oluşturulmamış. Lütfen daha
                  sonra tekrar ziyaret edin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-section-blue">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                <FiCalendar className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                2010
              </h3>
              <p className="text-gray-600">Kuruluş Yılı</p>
            </div>

            <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                <FiAward className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                13+
              </h3>
              <p className="text-gray-600">Yıllık Deneyim</p>
            </div>

            <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                <FiUsers className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                1000+
              </h3>
              <p className="text-gray-600">Mutlu Müşteri</p>
            </div>

            <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                <FiCheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent mb-2">
                99%
              </h3>
              <p className="text-gray-600">Başarı Oranı</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="py-16 bg-gradient-contact text-white relative overflow-hidden"
        style={
          brandingInfo?.brandColors
            ? {
                background: `linear-gradient(135deg, ${brandingInfo.brandColors.primary}, ${brandingInfo.brandColors.secondary || brandingInfo.brandColors.primary}dd)`,
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-overlay opacity-50"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {companyName} ile Çalışmaya Hazır mısınız?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Elektrik ihtiyaçlarınızı konuşmak ve ücretsiz teklif almak için
            bugün bizimle iletişime geçin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              İletişime Geç
            </Link>
            <Link
              href="/services"
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 shadow-lg"
            >
              Hizmetlerimiz
            </Link>
          </div>

          {/* Contact Info */}
          {contactInfo && (
            <div className="mt-12 pt-8 border-t border-white/30">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {contactInfo.phone && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                    <h3 className="font-semibold mb-2">Bizi Arayın</h3>
                    <p className="text-blue-100">{contactInfo.phone}</p>
                  </div>
                )}
                {contactInfo.email && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                    <h3 className="font-semibold mb-2">E-posta Gönderin</h3>
                    <p className="text-blue-100">{contactInfo.email}</p>
                  </div>
                )}
                {contactInfo.address && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                    <h3 className="font-semibold mb-2">Bizi Ziyaret Edin</h3>
                    <p className="text-blue-100">{contactInfo.address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AboutPage
