export default function () {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-3xl font-bold mb-4">Kullanım Şartları</h1>
      <p className="mb-4 text-gray-700">
        Web sitemize hoş geldiniz. Sitemize erişerek veya kullanarak aşağıdaki
        şart ve koşullara uymayı ve bağlı kalmayı kabul edersiniz.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Sitenin Kullanımı</h2>
      <ul className="list-disc list-inside mb-4 text-gray-700">
        <li>Bu siteyi kullanmak için en az 18 yaşında olmalısınız.</li>
        <li>
          Siteyi herhangi bir yasa dışı amaç için kullanmamayı kabul edersiniz.
        </li>
        <li>Hesap bilgilerinizin gizliliğini korumaktan siz sorumlusunuz.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">Fikri Mülkiyet</h2>
      <ul className="list-disc list-inside mb-4 text-gray-700">
        <li>
          Bu sitedeki tüm içerik site sahibinin veya lisans verenlerinin
          mülkiyetindedir.
        </li>
        <li>
          İzin almadan çoğaltamaz, dağıtamaz veya türev çalışmalar
          oluşturamazsınız.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        Sorumluluğun Sınırlandırılması
      </h2>
      <p className="mb-4 text-gray-700">
        Sitenin kullanımından kaynaklanan herhangi bir zarardan sorumlu değiliz.
        Site her türlü garanti olmaksızın "olduğu gibi" sunulmaktadır.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">
        Şartlardaki Değişiklikler
      </h2>
      <p className="mb-4 text-gray-700">
        Bu şartları dilediğimiz zaman güncelleme hakkını saklı tutarız. Siteyi
        kullanmaya devam etmeniz revize edilen şartları kabul ettiğiniz anlamına
        gelir.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Bize Ulaşın</h2>
      <p className="text-gray-700">
        Bu Kullanım Şartları hakkında sorularınız varsa bize şu adresten ulaşın:{' '}
        <a href="mailto:info@example.com" className="text-blue-600 underline">
          info@example.com
        </a>
        .
      </p>
    </div>
  )
}
