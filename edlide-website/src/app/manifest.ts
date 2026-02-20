import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Edlide IDE - Open Source AI-Powered Code Editor',
    short_name: 'Edlide IDE',
    description: 'Open source AI models have caught up to closed alternatives and cost 10x less. Break free from closed AI ecosystems.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0f14',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}