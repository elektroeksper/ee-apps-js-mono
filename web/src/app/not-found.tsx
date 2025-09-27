export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1
          style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: '#e5e7eb',
            lineHeight: '1',
            margin: '0',
          }}
        >
          404
        </h1>
        <h2
          style={{
            marginTop: '1.5rem',
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827',
            margin: '1.5rem 0 0.5rem 0',
          }}
        >
          Sayfa Bulunamadı
        </h2>
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0.5rem 0 2rem 0',
          }}
        >
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.375rem',
            fontWeight: '500',
            boxSizing: 'border-box',
          }}
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  )
}
