import Link from "next/link"
import clientPromise from "../lib/db"
import SearchForm from "../components/SearchForm"

export const dynamic = "force-dynamic"

const CHANNEL = process.env.NEXT_PUBLIC_CHANNEL_USERNAME || "poputtky_ua"

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
    if (!seen.has(key)) { seen.add(key); unique.push(item) }
  }
  return JSON.parse(JSON.stringify(unique.slice(0, 20)))
}

export default async function Home({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams
  const announcements = await getAnnouncements(params.from, params.to)
  const channelLink = "https://t.me/" + CHANNEL
  const isFiltered = Boolean(params.from || params.to)

  return (
    <main className="min-h-screen text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold gradient-text">Попутки UA</Link>
        <a href={channelLink} target="_blank" className="text-zinc-400 hover:text-cyan-400 text-sm">@{CHANNEL}</a>
      </nav>

      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <p className="text-cyan-400 text-sm tracking-widest uppercase mb-4">Ексклюзивна спільнота попутників</p>
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">Преміальні поїздки. Перевірені попутники. <span style={{color: "#FFFFFF"}}>Без турбот.</span></h1>
        <p className="text-zinc-300 text-lg mb-10 max-w-2xl mx-auto">Сучасна платформа для пошуку та публікації оголошень про спільні поїздки.</p>
        <div className="flex justify-center">
          <Link href="/new" className="gradient-btn px-10 py-4 rounded-xl font-bold transition">Створити оголошення</Link>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-cyan-400 text-sm tracking-widest uppercase mb-2 text-center">Як це працює</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">Знайди попутника за 3 кроки</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur hover:border-cyan-400 transition">
              <div className="gradient-text text-4xl font-bold mb-2">01</div>
              <h3 className="text-xl font-bold mb-2">Введи маршрут</h3>
              <p className="text-zinc-300 text-sm">Вкажи звідки і куди їдеш — система знайде найкращі варіанти.</p>
            </div>
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur hover:border-cyan-400 transition">
              <div className="gradient-text text-4xl font-bold mb-2">02</div>
              <h3 className="text-xl font-bold mb-2">Обери попутника</h3>
              <p className="text-zinc-300 text-sm">Переглянь оголошення водіїв або пасажирів.</p>
            </div>
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur hover:border-cyan-400 transition">
              <div className="gradient-text text-4xl font-bold mb-2">03</div>
              <h3 className="text-xl font-bold mb-2">Звяжись у Telegram</h3>
              <p className="text-zinc-300 text-sm">Одним кліком напиши в Telegram або відкрий пост у каналі.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto">
        <p className="text-cyan-400 text-sm tracking-widest uppercase mb-2 text-center">Каталог</p>
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10">{isFiltered ? "Результати пошуку" : "Останні оголошення"}</h2>
        <SearchForm />
        <h3 className="text-zinc-300 text-sm mb-6 mt-6">Знайдено: {announcements.length}</h3>
        {announcements.length === 0 ? (<div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-300 backdrop-blur">Нічого не знайдено за цим маршрутом</div>) : null}
        <div className="grid grid-cols-1 gap-4">
          {announcements.map((a: any) => (
            <div key={a._id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur hover:border-cyan-400 transition">
              <div className="flex justify-between items-start mb-3">
                <span className="text-zinc-200 font-semibold">@{a.telegramUsername}</span>
                <span className={a.role === "driver" ? "gradient-btn px-3 py-1 rounded-full text-xs font-bold" : "bg-zinc-700 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold"}>{a.role === "driver" ? "ВОДІЙ" : "ПАСАЖИР"}</span>
              </div>
              {a.from && a.to ? (<div className="text-cyan-400 font-bold mb-2">{a.from} → {a.to}</div>) : null}
              <pre className="text-zinc-200 text-sm whitespace-pre-wrap font-sans mb-4">{a.aiText}</pre>
              <div className="flex gap-2 flex-wrap">
                <a href={"https://t.me/" + a.telegramUsername} target="_blank" className="gradient-btn px-4 py-2 rounded-lg text-sm font-bold">Написати</a>
                {a.channelMessageId ? (<a href={"https://t.me/" + CHANNEL + "/" + a.channelMessageId} target="_blank" className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:border-cyan-400 hover:text-cyan-400">У каналі</a>) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-zinc-300 text-sm">
        <p className="mb-2">Попутки Україна © 2026</p>
        <p>Преміальна платформа для пошуку попутників</p>
      </footer>
    </main>
  )
}
