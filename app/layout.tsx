import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Poputtky UA",
  description: "Servis poshuku poputnykiv dlya shchodennykh prymiskykh poyizdok.",
  keywords: "poputnyky, blablakar, prymiske, Kyiv, Irpin",
  openGraph: {
    title: "Poputtky UA",
    description: "Shchodenni prymiske poyizdky",
    locale: "uk_UA",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" className={inter.variable}>
      <body className="min-h-full">
        {children}
        {/* Leaflet loaded as global scripts — available as window.L before React effects fire */}
        <Script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}
