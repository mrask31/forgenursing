import Link from 'next/link'

export default function NotFound() {
  return <main className="mx-auto max-w-lg px-6 py-20 text-slate-900">
    <p className="font-semibold text-teal-700">ForgeNursing</p>
    <h1 className="mt-4 text-3xl font-bold">We could not find that page</h1>
    <p className="mt-4 text-slate-600">The link may be outdated. Return home or open practice to keep studying.</p>
    <nav aria-label="Page recovery" className="mt-6 flex gap-6 font-semibold text-teal-800">
      <Link href="/">Home</Link><Link href="/quiz">Practice</Link><Link href="/faq">FAQ</Link>
    </nav>
  </main>
}
