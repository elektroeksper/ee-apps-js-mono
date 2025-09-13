import { useAbout, useBranding, useContact } from '@/hooks/useContentQueries'
import Link from 'next/link'
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiEye,
  FiTarget,
  FiUsers,
} from 'react-icons/fi'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading about information...</p>
        </div>
      </div>
    )
  }

  if (aboutError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load about information</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const defaultAbout = {
    title: 'About Us',
    description:
      'We are a leading provider of electrical services, committed to delivering excellence in every project.',
    mission:
      'To provide high-quality electrical services that ensure safety, reliability, and customer satisfaction.',
    vision: 'To be the most trusted electrical service provider in our region.',
    values: [
      'Quality',
      'Safety',
      'Reliability',
      'Customer Satisfaction',
      'Innovation',
    ],
    teamDescription:
      'Our team consists of certified electricians with years of experience.',
    establishedYear: 2010,
    experienceYears: 13,
  }

  const about = aboutInfo || defaultAbout
  const companyName = brandingInfo?.companyName || 'Electro Expert'

  return (
    <div className="min-h-screen bg-gradient-services">
      {/* Hero Section */}
      <div className="py-16 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-overlay"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {about.title || 'Hakkımızda'}
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {about.description}
          </p>
        </div>
      </div>

      {/* Stats Section */}
      {(about.establishedYear || about.experienceYears) && (
        <div className="py-16 bg-gradient-section-light">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {about.establishedYear && (
                <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                    <FiCalendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                    {about.establishedYear}
                  </h3>
                  <p className="text-gray-600">Kuruluş Yılı</p>
                </div>
              )}
              {about.experienceYears && (
                <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                    <FiAward className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
                    {about.experienceYears}+
                  </h3>
                  <p className="text-gray-600">Yıllık Deneyim</p>
                </div>
              )}
              <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                  <FiUsers className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">1000+</h3>
                <p className="text-gray-600">Mutlu Müşteri</p>
              </div>
              <div className="text-center bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full mx-auto mb-4 shadow-lg">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent mb-2">99%</h3>
                <p className="text-gray-600">Başarı Oranı</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission & Vision */}
      {(about.mission || about.vision) && (
        <div className="py-16 bg-gradient-section-blue">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {about.mission && (
                <div className="bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg mr-4 shadow-lg">
                      <FiTarget className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                      Misyonumuz
                    </h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {about.mission}
                  </p>
                </div>
              )}
              {about.vision && (
                <div className="bg-gradient-service-card p-8 rounded-2xl shadow-xl card-float border border-white/20">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg mr-4 shadow-lg">
                      <FiEye className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                      Vizyonumuz
                    </h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {about.vision}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Values Section */}
      {about.values && about.values.length > 0 && (
        <div className="py-16 bg-gradient-section-light">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Değerlerimiz
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Bu temel değerler yaptığımız her şeye rehberlik eder ve mükemmellik taahhüdümüzü şekillendirir.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {about.values.map((value, index) => (
                <div
                  key={index}
                  className="bg-gradient-service-card p-6 rounded-2xl shadow-xl text-center card-float border border-white/20"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full mx-auto mb-4 shadow-lg">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {value}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Section */}
      {about.teamDescription && (
        <div className="py-16 bg-gradient-section-blue">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Ekibimiz
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {about.teamDescription}
              </p>
            </div>

            {/* Team Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-service-card p-6 rounded-2xl shadow-xl text-center card-float border border-white/20">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <FiUsers className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sertifikalı Elektrikçiler
                </h3>
                <p className="text-gray-600">
                  Kapsamlı eğitime sahip lisanslı profesyoneller
                </p>
              </div>
              <div className="bg-gradient-service-card p-6 rounded-2xl shadow-xl text-center card-float border border-white/20">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <FiAward className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Uzman Teknisyenler
                </h3>
                <p className="text-gray-600">
                  En güncel elektrik teknolojilerinde yetkin
                </p>
              </div>
              <div className="bg-gradient-service-card p-6 rounded-2xl shadow-xl text-center card-float border border-white/20">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <FiCheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kalite Güvencesi
                </h3>
                <p className="text-gray-600">
                  Kusursuz sonuçlar sunmaya adanmış
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
