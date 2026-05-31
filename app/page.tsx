import { Metadata } from "next"
import { Suspense } from "react"
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

const PAGE_LIMIT = 20

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { ...activeFilter }
  if (from?.trim() && to?.trim()) {
    query.$and = [npMatch(from.trim()), npMatch(to.trim())]
  } else if (from?.trim()) {
    Object.assign(query, npMatch(from.trim()))
  } else if (to?.trim()) {
    Object.assign(query, npMatch(to.trim()))
  }

  // Fetch one extra to know if there are more pages
  const items = await db.collection("announcements")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(PAGE_LIMIT + 1)
    .toArray()

  const hasMore = items.length > PAGE_LIMIT
  return {
    items: JSON.parse(JSON.stringify(items.slice(0, PAGE_LIMIT))),
    hasMore,
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const params = await searchParams
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let items: any[] = []
  let hasMore = false
  let loadError = false
  try {
    const result = await getAnnouncements(params.from, params.to)
    items = result.items
    hasMore = result.hasMore
  } catch (_) {
    loadError = true
  }

  return (
    <Suspense>
      <FeedPage
        key={(params.from ?? "") + "|" + (params.to ?? "")}
        announcements={items}
        initialHasMore={hasMore}
        initialFrom={params.from ?? ""}
        initialTo={params.to ?? ""}
        loadError={loadError}
      />
    </Suspense>
  )
}
