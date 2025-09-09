export default function () {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-3xl font-bold mb-4">Gizlilik Politikası</h1>
      <p className="mb-4 text-gray-700">
        Gizliliğiniz bizim için önemlidir. Bu Gizlilik Politikası web sitemizi
        kullandığınızda bilgilerinizi nasıl topladığımızı, kullandığımızı ve
        koruduğumuzu açıklar.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Topladığımız Bilgiler</h2>
      <ul className="list-disc list-inside mb-4 text-gray-700">
        <li>Kişisel kimlik bilgileri (Ad, e-posta adresi vb.)</li>
        <li>Kullanım verileri ve çerezler</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        Bilgileri Nasıl Kullanıyoruz
      </h2>
      <ul className="list-disc list-inside mb-4 text-gray-700">
        <li>Hizmetimizi sağlamak ve sürdürmek için</li>
        <li>Hizmetimizdeki değişiklikler hakkında sizi bilgilendirmek için</li>
        <li>Web sitemizi geliştirmek için</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Haklarınız</h2>
      <p className="mb-4 text-gray-700">
        Kişisel bilgilerinize erişme, güncelleme veya silme hakkına sahipsiniz.
        Bu hakları kullanmak isterseniz bizimle iletişime geçin.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Bize Ulaşın</h2>
      <p className="text-gray-700">
        Bu Gizlilik Politikası hakkında sorularınız varsa bize şu adresten
        ulaşın:{' '}
        <a href="mailto:info@example.com" className="text-blue-600 underline">
          info@example.com
        </a>
        .
      </p>
    </div>
  )
}
