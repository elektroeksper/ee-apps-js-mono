import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
  hasGetInitialPropsRun?: boolean
  err?: Error
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-200">
            {statusCode || 'Error'}
          </h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {statusCode === 404 ? 'Sayfa Bulunamadı' : 'Bir Hata Oluştu'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {statusCode === 404
              ? 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.'
              : 'Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.'}
          </p>
        </div>
        <div className="space-y-4">
          <a
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

// Mark this component as an error page to skip normal layout
Error.skipLayout = true

export default Error
