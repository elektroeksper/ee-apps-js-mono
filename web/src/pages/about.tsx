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
    <div className="min-h-screen bg-gray-50">
      {(about.establishedYear || about.experienceYears) && (
        <div className="pb-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {about.establishedYear && (
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-4">
                    <FiCalendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {about.establishedYear}
                  </h3>
                  <p className="text-gray-600">Established</p>
                </div>
              )}
              {about.experienceYears && (
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-4">
                    <FiAward className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {about.experienceYears}+
                  </h3>
                  <p className="text-gray-600">Years of Experience</p>
                </div>
              )}
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mx-auto mb-4">
                  <FiUsers className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">1000+</h3>
                <p className="text-gray-600">Happy Customers</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mx-auto mb-4">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">99%</h3>
                <p className="text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission & Vision */}
      {(about.mission || about.vision) && (
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {about.mission && (
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mr-4">
                      <FiTarget className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Our Mission
                    </h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {about.mission}
                  </p>
                </div>
              )}
              {about.vision && (
                <div className="bg-white p-8 rounded-lg shadow-md">
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mr-4">
                      <FiEye className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Our Vision
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
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                These core values guide everything we do and shape our
                commitment to excellence.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {about.values.map((value, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-lg text-center"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto mb-4">
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
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Team
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {about.teamDescription}
              </p>
            </div>

            {/* Team Grid - Placeholder for future team member photos/info */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FiUsers className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Certified Electricians
                </h3>
                <p className="text-gray-600">
                  Licensed professionals with extensive training
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FiAward className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Uzman Teknisyenler
                </h3>
                <p className="text-gray-600">
                  En güncel elektrik teknolojilerinde yetkin
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <FiCheckCircle className="w-12 h-12 text-gray-400" />
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
        className="py-16 bg-blue-600 text-white"
        style={
          brandingInfo?.brandColors
            ? {
                backgroundColor: brandingInfo.brandColors.primary,
              }
            : undefined
        }
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
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
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              İletişime Geç
            </Link>
            <Link
              href="/services"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Hizmetlerimiz
            </Link>
          </div>

          {/* Contact Info */}
          {contactInfo && (
            <div className="mt-12 pt-8 border-t border-blue-500">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {contactInfo.phone && (
                  <div>
                    <h3 className="font-semibold mb-2">Bizi Arayın</h3>
                    <p className="text-blue-100">{contactInfo.phone}</p>
                  </div>
                )}
                {contactInfo.email && (
                  <div>
                    <h3 className="font-semibold mb-2">E-posta Gönderin</h3>
                    <p className="text-blue-100">{contactInfo.email}</p>
                  </div>
                )}
                {contactInfo.address && (
                  <div>
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
