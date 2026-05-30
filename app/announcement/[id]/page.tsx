import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import clientPromise from "../../../lib/db"
import { ObjectId } from "mongodb"
import BackButton from "../../../components/BackButton"
import { SITE } from "../../../lib/seo-config"

interface Props {
  params: Promise<{ id: string }>
}

async function getAnnouncementData(id: string) {
  try {
    if (!ObjectId.isValid(id)) return null
    const client = await clientPromise
    const db = client.db("carpooling")
    const item = await db.collection("announcements").findOne({ _id: new ObjectId(id) })
    if (!item) return null
    return JSON.parse(JSON.stringify(item))
  } catch {
    return null
  }
}

async function incrementViews(id: string) {
  try {
    const client = await clientPromise
    const db = client.db("carpooling")
    await db.collection("announcements").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { views: 1 } }
    )
  } catch {}
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const a = await getAnnouncementData(id)
  if (!a) return { title: "Оголошення не знайдено" }
  const role = a.role === "driver" ? "Водій" : "Пасажир"
  const title = `${role}: ${a.from} → ${a.to} — ПопуткиUA`
  const desc = a.aiText?.slice(0, 160) || `${role} шукає попутника: ${a.from} → ${a.to}`
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, locale: "uk_UA", type: "article" },
    alternates: { canonical: `${SITE.domain}/announcement/${id}` },
  }
}

const DAY_LABELS: Record<string, string> = { mon:"Пн", tue:"Вт", wed:"Ср", thu:"Чт", fri:"Пт", sat:"Сб", sun:"Нд" }
const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"]

export default async function AnnouncementPage({ params }: Props) {
  const { id } = await params
  const a = await getAnnouncementData(id)
  if (!a) notFound()
  await incrementViews(id)

  const role = a.role === "driver" ? "🚗 Водій" : "💺 Пасажир"
  const isDriver = a.role === "driver"

  const schedule = Array.isArray(a.schedule) && a.schedule.length > 0
    ? DAY_ORDER.filter((d: string) => a.schedule.includes(d)).map((d: string) => DAY_LABELS[d]).join(", ")
    : null

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `${a.role === "driver" ? "Водій" : "Пасажир"}: ${a.from} → ${a.to}`,
    "description": a.aiText,
    "location": {
      "@type": "Place",
      "name": `${a.from} → ${a.to}, Україна`,
    },
    "organizer": {
      "@type": "Person",
      "name": a.authorName || a.telegramUsername || "Анонімно",
    },
    "url": `${SITE.domain}/announcement/${id}`,
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-base font-extrabold text-[#111827] no-underline">
          Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
        </Link>
        <BackButton />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-16">

        {/* Роль */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full uppercase"
            style={isDriver
              ? { background: "#EBF2FC", color: "#3A6BBF" }
              : { background: "#FDECEA", color: "#E53935" }}>
            {role}
          </span>
          {a.isRoundTrip && (
            <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-full">↩ туди-назад</span>
          )}
          {a.tripScope === "intercity" && (
            <span className="text-xs text-[#065F46] bg-[#F0FDF4] px-2 py-1 rounded-full">🛣 Міжміська</span>
          )}
        </div>

        {/* Маршрут */}
        <h1 className="text-2xl font-extrabold text-[#111827] mb-2">
          {a.from}
          {(a.waypoints ?? []).map((w: any, i: number) => <span key={i}> → {w.name}</span>)}
          {" → "}{a.to}
        </h1>

        {/* Чіпи */}
        <div className="flex flex-wrap gap-2 mb-5">
          {a.tripType === "once" && a.departureDate && (
            <span className="text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1 rounded-full">
              📅 {new Date(a.departureDate).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          {a.tripType === "regular" && schedule && (
            <span className="text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1 rounded-full">🔄 {schedule}</span>
          )}
          {a.departureTime && (
            <span className="text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1 rounded-full">🕐 Виїзд {a.departureTime}</span>
          )}
          {a.isRoundTrip && a.returnTime && (
            <span className="text-xs bg-[#D1FAE5] text-[#065F46] px-3 py-1 rounded-full">↩ Назад {a.returnTime}</span>
          )}
          {a.seats > 0 && (
            <span className="text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1 rounded-full">
              👤 {a.seats} {a.seats === 1 ? "місце" : a.seats < 5 ? "місця" : "місць"}
            </span>
          )}
          {a.community && (
            <span className="text-xs bg-[#EBF2FC] text-[#3A6BBF] px-3 py-1 rounded-full">🏘 {a.community}</span>
          )}
        </div>

        {/* Опис */}
        {a.aiText && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-4">
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">{a.aiText}</p>
          </div>
        )}

        {/* Контакт */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
          <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Зв'язок</p>
          {a.telegramUsername ? (
            <a href={`https://t.me/${a.telegramUsername}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white no-underline"
              style={{ background: "#229ED9" }}>
              ✈️ Написати @{a.telegramUsername}
            </a>
          ) : a.phone ? (
            <p className="text-sm font-semibold text-[#374151]">📞 {a.phone}</p>
          ) : (
            <p className="text-sm text-[#9CA3AF]">Контакт не вказано</p>
          )}
        </div>

        <Link href="/"
          className="block text-center py-3 rounded-xl text-sm font-semibold no-underline border-2 transition-all"
          style={{ borderColor: "#5B8FD9", color: "#5B8FD9" }}>
          ← Переглянути всі оголошення
        </Link>
      </div>
    </div>
  )
}
