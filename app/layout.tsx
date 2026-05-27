import type { Metadata } from "next"
import { Inter } from "next/font/google"
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
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  )
}
