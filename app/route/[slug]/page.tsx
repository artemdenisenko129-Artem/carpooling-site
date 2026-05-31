import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ROUTES, CITIES, SITE, getRouteBySlug } from "../../../lib/seo-config"
import clientPromise from "../../../lib/db"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return ROUTES.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const route = getRouteBySlug(slug)
  if (!route) return {}
  const title = `Попутники ${route.from} → ${route.to} щодня | ${SITE.name}`
  const description = route.description
  return {
    title,
    description,
    keywords: [...route.keywords, "попутники", "попутчики", "карпулінг", "приміські поїздки"].join(", "),
    openGraph: { title, description, locale: "uk_UA", type: "website", url: `${SITE.domain}/route/${route.slug}`, siteName: SITE.name },
    alternates: { canonical: `${SITE.domain}/route/${route.slug}` },
  }
}

async function getRouteAnnouncements(from: string, to: string) {
  try {
    const client = await clientPromise
    const db = client.db("carpooling")
    const today = new Date().toISOString().slice(0, 10)
    const fromR = { $regex: from, $options: "i" }
    const toR = { $regex: to, $options: "i" }
    const items = await db.collection("announcements")
      .find({
        isActive: true,
        $or: [
          { tripType: "regular" },
          { tripType: "once", departureDate: { $gte: today } },
          { tripType: { $exists: false } },
        ],
        $and: [
          { $or: [{ searchFrom: fromR }, { searchTo: fromR }, { waypoints: { $elemMatch: { name: fromR } } }] },
          { $or: [{ searchFrom: toR }, { searchTo: toR }, { waypoints: { $elemMatch: { name: toR } } }] },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .project({ _id: 1, role: 1, from: 1, to: 1, tripType: 1, departureTime: 1, departureDate: 1, schedule: 1 })
      .toArray()
    return JSON.parse(JSON.stringify(items))
  } catch {
    return []
  }
}

const DAY_SHORT: Record<string, string> = { mon:"Пн", tue:"Вт", wed:"Ср", thu:"Чт", fri:"Пт", sat:"Сб", sun:"Нд" }
const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"]

export default async function RoutePage({ params }: Props) {
  const { slug } = await params
  const route = getRouteBySlug(slug)
  if (!route) notFound()

  const announcements = await getRouteAnnouncements(route.from, route.to)
  const reverseRoute = ROUTES.find(r => r.from === route.to && r.to === route.from)
  const cityConfig = CITIES.find(c => c.slug === route.fromSlug)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Попутники ${route.from} — ${route.to}`,
    "description": route.description,
    "provider": { "@type": "Organization", "name": SITE.name, "url": SITE.domain },
    "areaServed": [route.from, route.to],
    "serviceType": "Carpooling",
    "url": `${SITE.domain}/route/${route.slug}`,
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-1.5 no-underline shrink-0">
          <span className="text-base font-extrabold text-[#111827]">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline">
          ← Всі оголошення
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Заголовок */}
        <div className="mb-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">Щоденний маршрут · {route.distanceKm} км · {route.timeMin}</p>
          <h1 className="text-2xl font-extrabold text-[#111827] mb-2">
            Попутники {route.from} → {route.to}
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">{route.description}</p>
        </div>

        {/* CTA */}
        <Link
          href={`/?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`}
          className="block w-full text-center py-3.5 rounded-xl text-sm font-bold text-white no-underline mb-3 transition-opacity hover:opacity-90"
          style={{ background: "#5B8FD9" }}
        >
          🔍 Знайти попутника {route.from} → {route.to}
        </Link>
        <Link
          href="/new"
          className="block w-full text-center py-3 rounded-xl text-sm font-semibold no-underline mb-6 transition-colors border"
          style={{ background: "white", borderColor: "#E5E7EB", color: "#374151" }}
        >
          + Розмістити оголошення
        </Link>

        {/* Живі оголошення */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#374151] uppercase tracking-wide">Актуальні оголошення</h2>
            <span className="text-xs text-[#9CA3AF]">
              {announcements.length > 0 ? `${announcements.length} зараз` : "Поки немає"}
            </span>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#9CA3AF] mb-3">Оголошень по цьому маршруту ще немає</p>
              <Link href="/new" className="text-sm text-[#5B8FD9] font-semibold hover:underline">
                Розмісти перше →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {announcements.map((a: any) => {
                const isDriver = a.role === "driver"
                const scheduleStr = Array.isArray(a.schedule) && a.schedule.length > 0
                  ? DAY_ORDER.filter(d => a.schedule.includes(d)).map(d => DAY_SHORT[d]).join(", ")
                  : null
                const dateStr = a.tripType === "once" && a.departureDate
                  ? new Date(a.departureDate).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })
                  : scheduleStr
                return (
                  <Link key={a._id} href={`/announcement/${a._id}`}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-[#F3F4F6] no-underline hover:bg-[#EBF2FC] transition-colors"
                  >
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={isDriver ? { background: "#FDECEA", color: "#E53935" } : { background: "#EBF2FC", color: "#3A6BBF" }}>
                      {isDriver ? "Водій" : "Пасажир"}
                    </span>
                    <span className="text-sm font-semibold text-[#111827] truncate flex-1">{a.from} → {a.to}</span>
                    {dateStr && <span className="text-xs text-[#9CA3AF] shrink-0">{dateStr}</span>}
                    {a.departureTime && <span className="text-xs text-[#9CA3AF] shrink-0">{a.departureTime}</span>}
                  </Link>
                )
              })}
            </div>
          )}
          {announcements.length > 0 && (
            <div className="mt-3 text-center">
              <Link href={`/?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}`}
                className="text-xs text-[#5B8FD9] hover:underline font-medium">
                Показати всі оголошення →
              </Link>
            </div>
          )}
        </div>

        {/* Зворотній маршрут */}
        {reverseRoute && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
            <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">Зворотній маршрут</h2>
            <Link href={`/route/${reverseRoute.slug}`}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-[#F3F4F6] text-sm no-underline hover:bg-[#EBF2FC] transition-colors">
              <span className="text-[#5B8FD9] font-semibold">{reverseRoute.from}</span>
              <span className="text-[#9CA3AF]">→</span>
              <span className="font-semibold text-[#374151]">{reverseRoute.to}</span>
              <span className="ml-auto text-xs text-[#9CA3AF]">{reverseRoute.distanceKm} км · {reverseRoute.timeMin}</span>
            </Link>
          </div>
        )}

        {/* Як це працює */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
          <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">Як знайти попутника</h2>
          <ol className="flex flex-col gap-2 text-sm text-[#6B7280]">
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">1.</span> Переглянь оголошення вище або натисни "Знайти попутника"</li>
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">2.</span> Обери зручний час відправлення і роль (водій/пасажир)</li>
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">3.</span> Напиши напряму в Telegram — безкоштовно, без посередників</li>
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">4.</span> Або створи власне оголошення — воно з'явиться і на сайті, і в каналі</li>
          </ol>
        </div>

        {/* Посилання на місто */}
        {cityConfig && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
            <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">Про {route.from}</h2>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-3">{cityConfig.description}</p>
            <Link href={`/city/${cityConfig.slug}`}
              className="text-sm text-[#5B8FD9] hover:underline font-medium">
              Всі маршрути з {route.from} →
            </Link>
          </div>
        )}

        {/* Інші маршрути */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">Інші маршрути → Київ</h2>
          <div className="flex flex-wrap gap-2">
            {ROUTES.filter(r => r.slug !== slug && r.to === "Київ").map(r => (
              <Link key={r.slug} href={`/route/${r.slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#374151] no-underline hover:bg-[#EBF2FC] hover:text-[#3A6BBF] transition-colors">
                {r.from} → {r.to}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/new"
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white no-underline transition-opacity hover:opacity-90"
            style={{ background: "#5B8FD9" }}>
            + Розмістити оголошення безкоштовно
          </Link>
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Публікується і в{" "}
            <a href={SITE.tgChannel} target="_blank" rel="noopener noreferrer" className="text-[#5B8FD9] hover:underline">
              Telegram-каналі @poputky_ua
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
