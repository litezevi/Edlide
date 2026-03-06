import { redirect } from 'next/navigation'

export default function DocsPageFallback() {
  redirect('/ru/docs')
}
