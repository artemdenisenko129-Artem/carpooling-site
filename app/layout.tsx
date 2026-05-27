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
      <body className="min-h-full">
        {children}
      </body>
    </html>
  )
}
