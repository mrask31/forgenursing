import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ForgeNursing: AI NCLEX Tutor for Nursing Students | Master Prioritization & Clinical Reasoning",
  description: "AI tutor that helps nursing students master NCLEX prioritization using their own textbooks. Step-by-step clinical reasoning guidance. 7-day free trial. Join 500+ students who finally understand 'what to do first.'",
  keywords: "NCLEX prep, NCLEX study, nursing students, clinical reasoning, NCLEX questions, nursing exam, NCLEX tutor, nursing school, NCLEX prioritization, clinical judgment",
  openGraph: {
    title: "ForgeNursing: AI NCLEX Tutor for Nursing Students",
    description: "Master NCLEX prioritization using your own textbooks. Step-by-step clinical reasoning. 7-day free trial.",
    type: 'website',
    siteName: 'ForgeNursing',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ForgeNursing: AI NCLEX Tutor for Nursing Students",
    description: "Master NCLEX prioritization using your own textbooks. 7-day free trial.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-clinical-bg text-clinical-text-primary`}>
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