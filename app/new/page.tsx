"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PLACEHOLDER_EXAMPLE = `Опиши свій маршрут.

Приклад:
Їду щодня з Ірпінь (ЖД вокзал) до Києва (Оболонь) і назад.
Виїзд ~7:00, назад ~18:00. Через Гостомель, КПП.
Є 1 місце. Пишіть в особисті.`

export default function NewAnnouncement() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    telegramUsername: "",
    role: "driver",
    from: "",
    to: "",
    aiText: "",
    isRoundTrip: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create")
      }
      router.push("/")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold gradient-text">Попутки UA</Link>
        <Link href="/" className="text-zinc-400 hover:text-cyan-400 text-sm">На головну</Link>
      </nav>

      <section className="px-6 py-12 max-w-2xl mx-auto">
        <p className="text-cyan-400 text-sm tracking-widest uppercase mb-2 text-center">Нова поїздка</p>
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-center"><span className="gradient-text">Створи оголошення</span></h1>
        <p className="text-zinc-400 text-center mb-10">Заповни всі поля і знайди свого попутника</p>

        <form onSubmit={handleSubmit} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 backdrop-blur">
          <label className="block mb-5">
            <span className="block text-cyan-400 text-xs tracking-widest uppercase mb-2">Telegram username</span>
            <input type="text" required placeholder="@your_username" value={form.telegramUsername} onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none" />
          </label>

          <label className="block mb-5">
            <span className="block text-cyan-400 text-xs tracking-widest uppercase mb-2">Хто ти?</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white focus:border-cyan-400 focus:outline-none">
              <option value="driver">Водій</option>
              <option value="passenger">Пасажир</option>
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <label className="block">
              <span className="block text-cyan-400 text-xs tracking-widest uppercase mb-2">Звідки</span>
              <input type="text" required placeholder="Київ" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none" />
            </label>
            <label className="block">
              <span className="block text-cyan-400 text-xs tracking-widest uppercase mb-2">Куди</span>
              <input type="text" required placeholder="Львів" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none" />
            </label>
          </div>

          <label className="block mb-5">
            <span className="block text-cyan-400 text-xs tracking-widest uppercase mb-2">Опиши свій маршрут</span>
            <textarea required rows={9} placeholder={PLACEHOLDER_EXAMPLE} value={form.aiText} onChange={(e) => setForm({ ...form, aiText: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none resize-none" />
          </label>

          <label className="flex items-center mb-6 cursor-pointer">
            <input type="checkbox" checked={form.isRoundTrip} onChange={(e) => setForm({ ...form, isRoundTrip: e.target.checked })} className="mr-3 w-5 h-5 accent-cyan-400" />
            <span className="text-zinc-300">Поїздка туди-назад</span>
          </label>

          {error ? (<div className="bg-red-950 border border-red-800 text-red-300 p-3 rounded-xl mb-4 text-sm">Помилка: {error}</div>) : null}

          <button type="submit" disabled={loading} className="w-full gradient-btn py-4 rounded-xl font-bold transition disabled:opacity-50">
            {loading ? "Публікую..." : "Опублікувати"}
          </button>

          <Link href="/" className="block text-center mt-4 text-zinc-400 hover:text-cyan-400 text-sm">На головну</Link>
        </form>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-zinc-500 text-sm mt-12">
        <p>Попутки Україна © 2026</p>
      </footer>
    </main>
  )
}
