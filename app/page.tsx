import Link from "next/link"
import clientPromise from "../lib/db"
import SearchForm from "../components/SearchForm"

export const dynamic = "force-dynamic"

const BOT = process.env.NEXT_PUBLIC_BOT_USERNAME || "poputky_bot"
const CHANNEL = process.env.NEXT_PUBLIC_CHANNEL_USERNAME || "poputky_ua"

async function getAnnouncements(from?: string, to?: string) {
  const client = await clientPromise
  const db = client.db("carpooling")
  const query: any = { isActive: true }
  if (from && from.trim()) query.searchFrom = { $regex: from.toLowerCase().trim(), $options: "i" }
  if (to && to.trim()) query.searchTo = { $regex: to.toLowerCase().trim(), $options: "i" }
  const items = await db.collection("announcements").find(query).sort({ createdAt: -1 }).limit(40).toArray()

  const seen = new Set<string>()
  const unique: any[] = []
  for (const item of items) {
    const key = item.channelMessageId ? "ch:" + item.channelMessageId : "id:" + String(item._id)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(item)
    }
  }

  return JSON.parse(JSON.stringify(unique.slice(0, 20)))
}

export default async function Home({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams
  const announcements = await getAnnouncements(params.from, params.to)
  const channelLink = "https://t.me/" + CHANNEL
  const botLink = "https://t.me/" + BOT
  const isFiltered = Boolean(params.from || params.to)

  return (
    <main className="min-h-screen bg-blue-50">
      <header className="bg-blue-600 text-white p-6 text-center">
        <h1 className="text-4xl font-bold mb-2">Попутки Україна</h1>
        <p className="text-blue-100">Знайди попутника або пасажира для поїздки</p>
        <a href={channelLink} target="_blank" className="inline-block mt-3 text-blue-100 underline hover:text-white text-sm">Наш Telegram-канал: @{CHANNEL}</a>
      </header>
      <div className="max-w-2xl mx-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link href="/new" className="block bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700">+ Створити на сайті</Link>
          <a href={botLink} target="_blank" className="block bg-sky-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-sky-600">Опублікувати через бот</a>
        </div>
        <SearchForm />
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{isFiltered ? "Знайдено" : "Останні оголошення"} ({announcements.length})</h2>
        {announcements.length === 0 ? (<div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">Нічого не знайдено за цим маршрутом 😔</div>) : null}
        {announcements.map((a: any) => (
          <div key={a._id} className="bg-white rounded-xl shadow p-5 mb-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-semibold text-gray-500">@{a.telegramUsername}</span>
              <span className={a.role === "driver" ? "text-green-600 font-semibold text-sm" : "text-orange-500 font-semibold text-sm"}>{a.role === "driver" ? "Водій" : "Пасажир"}</span>
            </div>
            <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans">{a.aiText}</pre>
            <div className="flex gap-2 mt-3 flex-wrap">
              <a href={"https://t.me/" + a.telegramUsername} target="_blank" className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100">Написати в Telegram</a>
              {a.channelMessageId ? (<a href={"https://t.me/" + CHANNEL + "/" + a.channelMessageId} target="_blank" className="bg-purple-50 text-purple-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-100">Відкрити в каналі</a>) : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
