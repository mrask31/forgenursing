import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
export default function ResponsiveQA({ searchParams }: { searchParams: { path?: string } }) {
  if (process.env.VERCEL_ENV !== 'preview') notFound()
  const paths = ['/', '/signup', '/login', '/pricing', '/entry', '/quiz', '/readiness', '/review', '/settings', '/tutor']
  const path = paths.includes(searchParams.path || '') ? searchParams.path! : '/entry'
  return <main style={{ padding: 16, background: '#e5e7eb', color: '#111827' }}>
    <h1>Temporary responsive QA</h1>
    <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>{paths.map(p => <a key={p} href={`?path=${encodeURIComponent(p)}`}>{p}</a>)}</nav>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginTop: 16 }}>
      {[320, 390].map(width => <section key={width}><h2>{width} CSS px</h2><iframe title={`QA ${width}`} src={path} style={{ width, height: 844, border: '1px solid #64748b' }} /></section>)}
    </div>
  </main>
}
