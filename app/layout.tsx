import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Попутки UA — приміські щоденні поїздки",
  description: "Сервіс пошуку попутників для щоденних приміських поїздок. Знайди водія або пасажира на своєму маршруті.",
  keywords: "попутники, попутчики, блаблакар, приміські поїздки, Київ, Ірпінь, Буча, Бровари, Вишгород",
  openGraph: {
    title: "Попутки UA",
    description: "Щоденні приміські поїздки — знайди попутника поряд",
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
