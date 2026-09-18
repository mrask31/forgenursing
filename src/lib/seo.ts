import type { Metadata } from 'next'

export const SITE_URL = 'https://forgenursing.com'
export const SHARE_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: 'ForgeNursing — NCLEX-RN retake practice' }

export function pageMetadata(title: string, description: string, path: string, index = true): Metadata {
  return {
    title: { absolute: `${title} | ForgeNursing` },
    description,
    alternates: { canonical: `${SITE_URL}${path === '/' ? '' : path}` },
    robots: { index, follow: true },
    openGraph: { type: 'website', locale: 'en_US', siteName: 'ForgeNursing', title, description, url: `${SITE_URL}${path === '/' ? '' : path}`, images: [SHARE_IMAGE] },
    twitter: { card: 'summary_large_image', title, description, images: [SHARE_IMAGE] },
  }
}
