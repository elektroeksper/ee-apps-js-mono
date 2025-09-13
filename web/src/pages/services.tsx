import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-services">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="bg-gradient-service-card rounded-2xl shadow-xl p-8 border border-white/20">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Hizmetlerimiz
            </h1>
            <p className="text-xl text-gray-600">
              Profesyonel elektrik ve elektronik hizmetleri
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Service Card 1 */}
          <div className="bg-gradient-service-card rounded-2xl shadow-xl overflow-hidden card-float border border-white/20">
            <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-overlay-blue opacity-30"></div>
              <svg
                className="w-20 h-20 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Elektrik Tesisatı
              </h3>
              <p className="text-gray-600 mb-4">
                Ev ve işyeri elektrik tesisatı kurulum ve bakım hizmetleri
              </p>
              <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200">
                Detaylar
              </Button>
            </div>
          </div>

          {/* Service Card 2 */}
          <div className="bg-gradient-service-card rounded-2xl shadow-xl overflow-hidden card-float border border-white/20">
            <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-overlay opacity-30"></div>
              <svg
                className="w-20 h-20 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Elektronik Tamir
              </h3>
              <p className="text-gray-600 mb-4">
                Her türlü elektronik cihaz tamir ve bakım hizmetleri
              </p>
              <Button variant="outline" className="w-full hover:bg-green-50 border-green-200">
                Detaylar
              </Button>
            </div>
          </div>

          {/* Service Card 3 */}
          <div className="bg-gradient-service-card rounded-2xl shadow-xl overflow-hidden card-float border border-white/20">
            <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-overlay opacity-30"></div>
              <svg
                className="w-20 h-20 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 7H7v6h6V7z" />
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Güvenlik Sistemleri
              </h3>
              <p className="text-gray-600 mb-4">
                Kamera ve alarm sistemleri kurulum ve bakımı
              </p>
              <Button variant="outline" className="w-full hover:bg-purple-50 border-purple-200">
                Detaylar
              </Button>
            </div>
          </div>

          {/* Service Card 4 */}
          <div className="bg-gradient-service-card rounded-2xl shadow-xl overflow-hidden card-float border border-white/20">
            <div className="h-48 bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-overlay opacity-30"></div>
              <svg
                className="w-20 h-20 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aydınlatma Sistemleri
              </h3>
              <p className="text-gray-600 mb-4">
                LED ve modern aydınlatma çözümleri
              </p>
              <Button variant="outline" className="w-full hover:bg-yellow-50 border-yellow-200">
                Detaylar
              </Button>
            </div>
          </div>

          {/* Service Card 5 */}
          <div className="bg-gradient-service-card rounded-2xl shadow-xl overflow-hidden card-float border border-white/20">
            <div className="h-48 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-overlay opacity-30"></div>
              <svg
                className="w-20 h-20 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Acil Servis
              </h3>
              <p className="text-gray-600 mb-4">
                7/24 acil elektrik ve elektronik arıza hizmetleri
              </p>
              <Button variant="outline" className="w-full hover:bg-red-50 border-red-200">
                Detaylar
              </Button>
            </div>
          </div>

          {/* Service Card 6 */}
          <div className="bg-gradient-service-card rounded-2xl shadow-xl overflow-hidden card-float border border-white/20">
            <div className="h-48 bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-overlay opacity-30"></div>
              <svg
                className="w-20 h-20 text-white relative z-10"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6 3a1 1 0 011-1h.01a1 1 0 010 2H7a1 1 0 01-1-1zm2 3a1 1 0 00-2 0v1a2 2 0 00-2 2v1a2 2 0 00-2 2v.683a3.7 3.7 0 011.055.485 1.704 1.704 0 001.89 0 3.704 3.704 0 012.11 0 1.704 1.704 0 001.89 0 3.704 3.704 0 012.11 0 1.704 1.704 0 001.89 0A3.7 3.7 0 0118 12.683V12a2 2 0 00-2-2V9a2 2 0 00-2-2V6a1 1 0 10-2 0v1h-1V6a1 1 0 10-2 0v1H8V6zm10 8.868a3.704 3.704 0 01-2.055.485 1.704 1.704 0 01-1.89 0 3.704 3.704 0 00-2.11 0 1.704 1.704 0 01-1.89 0 3.704 3.704 0 00-2.11 0 1.704 1.704 0 01-1.89 0A3.7 3.7 0 012 14.868V17a1 1 0 001 1h14a1 1 0 001-1v-2.132zM9 3a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Danışmanlık
              </h3>
              <p className="text-gray-600 mb-4">
                Elektrik ve elektronik proje danışmanlık hizmetleri
              </p>
              <Button variant="outline" className="w-full hover:bg-indigo-50 border-indigo-200">
                Detaylar
              </Button>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-contact rounded-2xl p-8 text-center text-white shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold mb-4">
            Size Nasıl Yardımcı Olabiliriz?
          </h2>
          <p className="text-lg mb-6">
            İhtiyacınız olan hizmeti bulamadıysanız, bizimle iletişime geçin.
          </p>
          <Link href="/contact">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 transform transition-all hover:scale-105 shadow-lg">
              İletişime Geç
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
