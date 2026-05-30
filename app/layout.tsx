import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import ConsentModal from "../components/ConsentModal"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  title: "ПопуткиUA — приміські поїздки",
  description: "Сервіс пошуку попутників для щоденних приміських поїздок. Водії та пасажири — Київ, Ірпінь, Буча, Бровари та інші напрямки.",
  keywords: "попутки, попутники, приміські поїздки, бла бла кар, Київ, Ірпінь, Буча, Бровари, водій, пасажир",
  openGraph: {
    title: "ПопуткиUA — приміські поїздки",
    description: "Щоденні приміські поїздки — знайди водія або пасажира по дорозі",
    locale: "uk_UA",
    type: "website",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://tile.openstreetmap.org" />
        <link rel="preconnect" href="https://a.tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://api.telegram.org" />
      </head>
      <body className="min-h-full">
        {children}
        <ConsentModal />
        <Script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js" strategy="afterInteractive" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
