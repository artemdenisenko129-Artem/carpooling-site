import { Suspense } from "react"
import type { Metadata } from "next"
import clientPromise from "../../lib/db"
import MapPageClient from "../../components/MapPageClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Карта попутників — ПопуткиUA",
  description: "Переглядай маршрути водіїв і пасажирів на карті. Знайди попутника поруч із собою.",
  openGraph: {
    title: "Карта попутників — ПопуткиUA",
    description: "Маршрути водіїв і пасажирів на інтерактивній карті України.",
    locale: "uk_UA",
    type: "website",
  },
}

async function getMapAnnouncements() {
  const client = await clientPromise
  const db = client.db("carpooling")
  const today = new Date().toISOString().slice(0, 10)
  const activeFilter = {
    isActive: true,
    $or: [
      { tripType: "regular" },
      { tripType: "once", departureDate: { $gte: today } },
      { tripType: { $exists: false } },
      { departureDate: { $exists: false } },
    ],
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = await db
    .collection("announcements")
    .find(activeFilter)
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray()
  return JSON.parse(JSON.stringify(items))
}

export default async function MapPage() {
  let announcements: Awaited<ReturnType<typeof getMapAnnouncements>> = []
  try {
    announcements = await getMapAnnouncements()
  } catch (_) {}

  return (
    <Suspense>
      <MapPageClient announcements={announcements} />
    </Suspense>
  )
}
