import { redirect } from 'next/navigation'

// Keep old links working through the current no-card trial / paid checkout flow.
export default function LegacyBillingPage() {
  redirect('/checkout?checkout=canceled')
}
