import { redirect } from 'next/navigation'

export default function AccountPageFallback() {
  redirect('/ru/account')
}
