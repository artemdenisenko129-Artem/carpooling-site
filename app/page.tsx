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

  if (from?.trim() && to?.trim()) {
    const f = from.toLowerCase().trim()
    const t = to.toLowerCase().trim()
    const directQuery = { ...activeFilter, searchFrom: { $regex: f, $options: "i" }, searchTo: { $regex: t, $options: "i" } }
    const reverseQuery = { ...activeFilter, isRoundTrip: true, searchFrom: { $regex: t, $options: "i" }, searchTo: { $regex: f, $options: "i" } }
    const [direct, reverse] = await Promise.all([
      db.collection("announcements").find(directQuery).sort({ createdAt: -1 }).limit(30).toArray(),
      db.collection("announcements").find(reverseQuery).sort({ createdAt: -1 }).limit(20).toArray(),
    ])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reversedTagged = reverse.map((r: any) => ({ ...r, _matchedAsReturn: true }))
    items = [...direct, ...reversedTagged]
  } else {
    const query: Record<string, unknown> = { ...activeFilter }
    if (from?.trim()) query.searchFrom = { $regex: from.toLowerCase().trim(), $options: "i" }
    if (to?.trim())   query.searchTo   = { $regex: to.toLowerCase().trim(),   $options: "i" }
    items = await db.collection("announcements").find(query).sort({ createdAt: -1 }).limit(50).toArray()
  }

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
  const announcements = await getAnnouncements(params.from, params.to)

  return (
    <FeedPage
      announcements={announcements}
      initialFrom={params.from ?? ""}
      initialTo={params.to ?? ""}
    />
  )
}
