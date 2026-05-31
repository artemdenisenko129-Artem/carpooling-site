import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CITIES, getCityBySlug, SITE } from "../../../lib/seo-config"
import clientPromise from "../../../lib/db"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return {}
  const title = `Попутники ${city.name} — ${city.hubCity} | ${SITE.name}`
  const description = city.description
  return {
    title,
    description,
    keywords: [...city.keywords, ...SITE.keywords].join(", "),
    openGraph: { title, description, locale: "uk_UA", type: "website", url: `${SITE.domain}/city/${city.slug}`, siteName: SITE.name },
    alternates: { canonical: `${SITE.domain}/city/${city.slug}` },
  }
}

async function getCityAnnouncements(cityName: string) {
  try {
    const client = await clientPromise
    const db = client.db("carpooling")
    const regex = new RegExp(cityName, "i")
    const items = await db.collection("announcements")
      .find({ isActive: true, $or: [{ from: regex }, { to: regex }] })
      .sort({ createdAt: -1 })
      .limit(5)
      .project({ _id: 1, role: 1, from: 1, to: 1, tripType: 1, departureTime: 1, departureDate: 1, schedule: 1 })
      .toArray()
    return JSON.parse(JSON.stringify(items))
  } catch {
    return []
  }
}

const DAY_SHORT: Record<string, string> = { mon:"Пн", tue:"Вт", wed:"Ср", thu:"Чт", fri:"Пт", sat:"Сб", sun:"Нд" }
const DAY_ORDER = ["mon","tue","wed","thu","fri","sat","sun"]

export default async function CityPage({ params }: Props) {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) notFound()
  const announcements = await getCityAnnouncements(city.name)

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-[#5B8FD9] text-sm font-medium hover:underline">
          ← Всі оголошення
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">{city.region}</p>
          <h1 className="text-2xl font-extrabold text-[#111827] mb-2">
            Попутники {city.name} — {city.hubCity}
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">{city.description}</p>
        </div>

        <Link
          href={`/?from=${encodeURIComponent(city.name)}&to=${encodeURIComponent(city.hubCity)}`}
          className="block w-full text-center py-3.5 rounded-xl text-sm font-bold text-white no-underline mb-6 transition-opacity hover:opacity-90"
          style={{ background: "#5B8FD9" }}
        >
          🔍 Знайти попутника {city.name} → {city.hubCity}
        </Link>

        {/* Популярні маршрути */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
          <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">Популярні маршрути</h2>
          <div className="flex flex-col gap-2">
            {city.routes.map((route) => {
              const [from, to] = route.split(" → ")
              return (
                <Link key={route}
                  href={from && to ? `/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : "/"}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[#F3F4F6] text-sm text-[#374151] no-underline hover:bg-[#EBF2FC] transition-colors"
                >
                  <span className="text-[#5B8FD9] font-semibold">{from}</span>
                  <span className="text-[#9CA3AF]">→</span>
                  <span className="text-[#374151] font-semibold">{to}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Живі оголошення */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#374151] uppercase tracking-wide">Актуальні оголошення</h2>
            <span className="text-xs text-[#9CA3AF]">
              {announcements.length > 0 ? `${announcements.length} зараз активних` : "Поки немає"}
            </span>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-4">
              Оголошень по {city.name} ще немає —{" "}
              <Link href="/new" className="text-[#5B8FD9] hover:underline">додай перше</Link>
            </p>
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
                      style={isDriver
                        ? { background: "#FDECEA", color: "#E53935" }
                        : { background: "#EBF2FC", color: "#3A6BBF" }}>
                      {isDriver ? "Водій" : "Пасажир"}
                    </span>
                    <span className="text-sm font-semibold text-[#111827] truncate flex-1">
                      {a.from} → {a.to}
                    </span>
                    {dateStr && <span className="text-xs text-[#9CA3AF] shrink-0">{dateStr}</span>}
                    {a.departureTime && <span className="text-xs text-[#9CA3AF] shrink-0">{a.departureTime}</span>}
                  </Link>
                )
              })}
            </div>
          )}
          {announcements.length > 0 && (
            <div className="mt-3 text-center">
              <Link href={`/?from=${encodeURIComponent(city.name)}`}
                className="text-xs text-[#5B8FD9] hover:underline font-medium">
                Переглянути всі оголошення з {city.name} →
              </Link>
            </div>
          )}
        </div>

        {/* Як це працює */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-6">
          <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">
            Як знайти попутника з {city.nameGenitive}
          </h2>
          <ol className="flex flex-col gap-2 text-sm text-[#6B7280]">
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">1.</span> Переглянь оголошення на карті або у списку</li>
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">2.</span> Обери зручний маршрут і час відправлення</li>
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">3.</span> Напиши водію або пасажиру напряму в Telegram</li>
            <li className="flex gap-2"><span className="font-bold text-[#5B8FD9]">4.</span> Або створи власне оголошення — безкоштовно</li>
          </ol>
        </div>

        {/* Інші міста */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-bold text-[#374151] mb-3 uppercase tracking-wide">Інші міста</h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== slug).map((c) => (
              <Link key={c.slug} href={`/city/${c.slug}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#374151] no-underline hover:bg-[#EBF2FC] hover:text-[#3A6BBF] transition-colors">
                {c.name}
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
            Публікується на сайті і в{" "}
            <a href={SITE.tgChannel} target="_blank" rel="noopener noreferrer" className="text-[#5B8FD9] hover:underline">
              Telegram-каналі
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
