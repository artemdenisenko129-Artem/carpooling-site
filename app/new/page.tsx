"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import PlaceAutocomplete from "../../components/PlaceAutocomplete"

function LogoSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 70 Q18 50 38 48 Q58 46 58 26 Q58 10 42 8" stroke="#1a1a2e" strokeWidth="13" strokeLinecap="round" fill="none"/>
      <path d="M18 70 Q18 50 38 48 Q58 46 58 26 Q58 10 42 8" stroke="#5B8FD9" strokeWidth="8" strokeLinecap="round" fill="none"/>
      <circle cx="42" cy="8" r="9" fill="#E53935" />
      <circle cx="42" cy="8" r="3.5" fill="white" />
      <path d="M42 17 L38.5 23 L45.5 23 Z" fill="#E53935" />
      <circle cx="18" cy="70" r="9" fill="#5B8FD9" />
      <circle cx="18" cy="70" r="3.5" fill="white" />
      <path d="M18 79 L14.5 85 L21.5 85 Z" fill="#5B8FD9" />
    </svg>
  )
}

const PLACEHOLDER_EXAMPLE = `Їду щодня з Ірпінь (ЖД вокзал) до Києва (Оболонь) і назад.
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
        throw new Error(data.error || "Помилка публікації")
      }
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Невідома помилка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* Хедер */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <LogoSVG />
          <span className="text-base font-extrabold text-[#111827]">
            Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline"
        >
          ← На головну
        </Link>
      </header>

      {/* Форма */}
      <div className="px-4 py-6 pb-10 max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-[#111827] mb-1">Нове оголошення</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Заповни форму — оголошення з&#39;явиться на сайті та в Telegram-каналі</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Telegram username */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Telegram username
            </label>
            <input
              type="text"
              required
              placeholder="@your_username"
              value={form.telegramUsername}
              onChange={(e) => setForm({ ...form, telegramUsername: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
            />
          </div>

          {/* Роль */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Ти хто?
            </label>
            <div className="flex gap-3">
              {[
                { val: "driver",    label: "🚗 Водій" },
                { val: "passenger", label: "💺 Пасажир" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, role: val })}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.role === val
                    ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                    : { background: "white",   borderColor: "#E5E7EB",  color: "#374151" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Звідки / Куди */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                Звідки
              </label>
              <PlaceAutocomplete
                value={form.from}
                onChange={(v) => setForm({ ...form, from: v })}
                placeholder="Ірпінь"
                dotColor="blue"
                inputClassName="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
                Куди
              </label>
              <PlaceAutocomplete
                value={form.to}
                onChange={(v) => setForm({ ...form, to: v })}
                placeholder="Київ"
                dotColor="red"
                inputClassName="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9]"
              />
            </div>
          </div>

          {/* Опис */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide mb-1.5">
              Опис маршруту
            </label>
            <textarea
              required
              rows={6}
              placeholder={PLACEHOLDER_EXAMPLE}
              value={form.aiText}
              onChange={(e) => setForm({ ...form, aiText: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-colors focus:border-[#5B8FD9] resize-none"
            />
            <p className="text-xs text-[#9CA3AF] mt-1">
              Вкажи час, дні, зупинки, кількість місць — все що важливо попутнику
            </p>
          </div>

          {/* Туди-назад */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
              style={form.isRoundTrip
                ? { background: "#5B8FD9", borderColor: "#5B8FD9" }
                : { background: "white", borderColor: "#D1D5DB" }
              }
            >
              {form.isRoundTrip && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.isRoundTrip}
              onChange={(e) => setForm({ ...form, isRoundTrip: e.target.checked })}
            />
            <span className="text-sm text-[#374151]">Поїздка туди-назад (↩ обидва напрямки)</span>
          </label>

          {/* Помилка */}
          {error && (
            <div className="bg-[#FDECEA] border border-[#FECACA] rounded-xl p-3 text-sm text-[#B91C1C]">
              ⚠️ {error}
            </div>
          )}

          {/* Кнопка */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-60"
            style={{ background: "#5B8FD9", boxShadow: "0 4px 16px rgba(91,143,217,0.4)" }}
          >
            {loading ? "Публікую..." : "Опублікувати оголошення"}
          </button>

          <p className="text-xs text-center text-[#9CA3AF]">
            Публікуючи, ти погоджуєшся з{" "}
            <a href="#" className="underline" style={{ color: "#5B8FD9" }}>правилами сайту</a>
          </p>
        </form>
      </div>
    </div>
  )
}
