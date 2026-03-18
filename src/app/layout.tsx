import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "ForgeNursing: AI NCLEX Tutor for Nursing Students | Master Prioritization & Clinical Reasoning",
  description: "AI tutor that helps nursing students master NCLEX prioritization using their own textbooks. Step-by-step clinical reasoning guidance. 7-day free trial. Join 500+ students who finally understand 'what to do first.'",
  keywords: "NCLEX prep, NCLEX study, nursing students, clinical reasoning, NCLEX questions, nursing exam, NCLEX tutor, nursing school, NCLEX prioritization, clinical judgment, NCLEX RN, nursing test prep, NCLEX practice questions, nursing education",
  authors: [{ name: "ForgeNursing" }],
  creator: "ForgeNursing",
  publisher: "ForgeNursing",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://forgenursing.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "ForgeNursing: AI NCLEX Tutor for Nursing Students",
    description: "Master NCLEX prioritization using your own textbooks. Step-by-step clinical reasoning. 7-day free trial.",
    url: '/',
    siteName: 'ForgeNursing',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/hero-chat-preview.png',
        width: 1200,
        height: 630,
        alt: 'ForgeNursing AI Tutor Interface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "ForgeNursing: AI NCLEX Tutor for Nursing Students",
    description: "Master NCLEX prioritization using your own textbooks. 7-day free trial.",
    images: ['/hero-chat-preview.png'],
    creator: '@forgenursing',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes when you have them
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased bg-clinical-bg text-clinical-text-primary`}>
        {/* Google Tag Manager */}
        <Script
          id="gtm-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WGRTRVG9');
            `,
          }}
        />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WGRTRVG9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}