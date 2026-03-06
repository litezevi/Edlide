import { redirect } from 'next/navigation'

export default function PricingPageFallback() {
  redirect('/ru/pricing')
}
