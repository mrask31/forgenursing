import {pageMetadata} from '@/lib/seo'
import RetakePassCheckout from '@/components/account/RetakePassCheckout'
export const metadata=pageMetadata('Retake Pass — $29.99 for 3 months','Seven-day free trial, no card. $29.99 one-time for three months. Don’t pass? Three more months free. Nothing auto-renews.','/pricing')
export default function PricingPage(){return <RetakePassCheckout />}
