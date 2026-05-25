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

  const query: Record<string, unknown> = { isActive: true }
  if (from?.trim()) query.searchFrom = { $regex: from.toLowerCase().trim(), $options: "i" }
  if (to?.trim())   query.searchTo   = { $regex: to.toLowerCase().trim(),   $options: "i" }

  const items = await db
    .collection("announcements")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(40)
    .toArray()

  const seen = new Set<string>()
  const unique: typeof items = []
  for (const item of items) {
    const key = item.channelMessageId ? "ch:" + item.channelMessageId : "id:" + String(item._id)
    if (!seen.has(key)) { seen.add(key); unique.push(item) }
  }

  return JSON.parse(JSON.stringify(unique.slice(0, 20)))
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
