import { Metadata } from "next"
import clientPromise from "../lib/db"
import FeedPage from "../components/FeedPage"
import { SITE } from "../lib/seo-config"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  keywords: SITE.keywords.join(", "),
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    locale: "uk_UA",
    type: "website",
    url: SITE.domain,
    siteName: SITE.name,
  },
  alternates: {
    canonical: SITE.domain,
  },
}

async function getAnnouncements(from?: string, to?: string) {
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
  let items: any[]

  // Функція: НП зустрічається у from, to або waypoints
  function npMatch(np: string) {
    const r = { $regex: np, $options: "i" }
    return {
      $or: [
        { searchFrom: r },
        { searchTo: r },
        { waypoints: { $elemMatch: { name: r } } },
      ]
    }
  }

  const query: Record<string, unknown> = { ...activeFilter }
  if (from?.trim() && to?.trim()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (query as any).$and = [npMatch(from.trim()), npMatch(to.trim())]
  } else if (from?.trim()) {
    Object.assign(query, npMatch(from.trim()))
  } else if (to?.trim()) {
    Object.assign(query, npMatch(to.trim()))
  }
  items = await db.collection("announcements").find(query).sort({ createdAt: -1 }).limit(50).toArray()

  const seen = new Set<string>()
  const unique: typeof items = []
  for (const item of items) {
    const key = "id:" + String(item._id)
    if (!seen.has(key)) { seen.add(key); unique.push(item) }
  }

  return JSON.parse(JSON.stringify(unique.slice(0, 40)))
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const params = await searchParams
  let announcements: Awaited<ReturnType<typeof getAnnouncements>> = []
  try {
    announcements = await getAnnouncements(params.from, params.to)
  } catch (_) {
    // DB unavailable - show empty feed instead of server error
  }

  return (
    <FeedPage
      announcements={announcements}
      initialFrom={params.from ?? ""}
      initialTo={params.to ?? ""}
    />
  )
}
