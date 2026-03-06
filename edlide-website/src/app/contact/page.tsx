import { redirect } from 'next/navigation'

export default function ContactPageFallback() {
  redirect('/ru/contact')
}
