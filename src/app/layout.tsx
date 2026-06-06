import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "ForgeNursing: AI NCLEX Tutor for Nursing Students",
  description: "AI tutor that helps nursing students practice NCLEX-style clinical reasoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased bg-clinical-bg text-clinical-text-primary`}>
        {children}
      </body>
    </html>
  );
}
