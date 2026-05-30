"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, logout } from "../../lib/useSession"

interface Announcement {
  _id: string
  role: "driver" | "passenger"
  from: string
  to: string
  aiText: string
  createdAt: string
  isActive?: boolean
  tripType?: string
  departureDate?: string
  waypoints?: { name: string }[]
}

export default function ProfilePage() {
  const router = useRouter()
  const { isLoggedIn, user, loading: sessionLoading } = useSession()
  const [tab, setTab] = useState<"profile" | "announcements">("profile")
  const [phone, setPhone] = useState("")
  const [community, setCommunity] = useState("")
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (sessionLoading) return // чекаємо поки сесія завантажиться
    if (!isLoggedIn) { router.replace("/login"); return }
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => { setPhone(d.phone || ""); setCommunity(d.community || "") })
  }, [isLoggedIn, sessionLoading])

  useEffect(() => {
    if (tab === "announcements") {
      setLoading(true)
      fetch("/api/profile/announcements")
        .then(r => r.json())
        .then(d => { setAnnouncements(Array.isArray(d) ? d : []); setLoading(false) })
    }
  }, [tab])

  async function handleSave() {
    setSaving(true)
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, community }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleDelete(id: string) {
    if (!confirm("Деактивувати оголошення?")) return
    await fetch(`/api/announcements/${id}`, { method: "DELETE" })
    setAnnouncements(prev => prev.filter(a => a._id !== id))
  }

  const inputCls = "w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#5B8FD9] transition-colors"

  if (sessionLoading) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-[#5B8FD9] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-base font-extrabold text-[#111827] no-underline">
          Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
        </Link>
        <button onClick={logout} className="text-sm text-[#6B7280] hover:text-[#E53935] transition-colors">
          Вийти
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 pb-16">
        {/* Аватар і ім'я */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#EBF2FC] flex items-center justify-center text-2xl font-bold text-[#3A6BBF]">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#111827]">{user?.name || "Користувач"}</p>
            {user?.telegramUsername && (
              <p className="text-sm text-[#6B7280]">@{user.telegramUsername.replace("@", "")}</p>
            )}
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-[#E5E7EB] mb-6">
          {([
            { key: "profile", label: "👤 Мій профіль" },
            { key: "announcements", label: "📋 Мої оголошення" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-sm font-medium border-b-2 transition-all"
              style={tab === key
                ? { color: "#5B8FD9", borderColor: "#5B8FD9", fontWeight: 700 }
                : { color: "#9CA3AF", borderColor: "transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Профіль */}
        {tab === "profile" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Контакти</p>

              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Telegram</label>
                <div className="flex items-center gap-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5">
                  <span className="text-sm text-[#6B7280]">
                    {user?.telegramUsername
                      ? `@${user.telegramUsername.replace("@", "")}`
                      : "Не підключено"}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-1">Telegram прив'язується при вході через Telegram</p>
              </div>

              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Телефон або інший контакт</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+380 50 123 45 67 · @viber_nick"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Спільнота</p>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Ваша спільнота</label>
                <input
                  value={community}
                  onChange={e => setCommunity(e.target.value)}
                  placeholder="КПІ, ЖК Новий Автограф, Samsung Ukraine..."
                  className={inputCls}
                />
                <p className="text-xs text-[#9CA3AF] mt-1">ЖК, університет, компанія або район — буде автоматично підставлятись в оголошення</p>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: saved ? "#10B981" : "#5B8FD9" }}>
              {saving ? "Зберігаю..." : saved ? "✓ Збережено" : "Зберегти профіль"}
            </button>

            <Link href="/new"
              className="block text-center py-3 rounded-xl text-sm font-bold no-underline border-2 transition-all"
              style={{ borderColor: "#5B8FD9", color: "#5B8FD9" }}>
              + Нове оголошення
            </Link>
          </div>
        )}

        {/* Мої оголошення */}
        {tab === "announcements" && (
          <div className="flex flex-col gap-3">
            {loading && <p className="text-sm text-[#9CA3AF] text-center py-8">Завантаження...</p>}
            {!loading && announcements.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
                <p className="text-sm text-[#6B7280]">У вас ще немає оголошень</p>
                <Link href="/new" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
                  style={{ background: "#5B8FD9" }}>
                  Створити оголошення
                </Link>
              </div>
            )}
            {announcements.map(a => (
              <div key={a._id} className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase"
                    style={a.role === "driver"
                      ? { background: "#EBF2FC", color: "#3A6BBF" }
                      : { background: "#FDECEA", color: "#E53935" }}>
                    {a.role === "driver" ? "Водій" : "Пасажир"}
                  </span>
                  <button onClick={() => handleDelete(a._id)}
                    className="text-xs text-[#9CA3AF] hover:text-[#E53935] transition-colors px-2 py-1 rounded-lg hover:bg-[#FDECEA]">
                    Деактивувати
                  </button>
                </div>
                <p className="text-sm font-bold text-[#111827] mb-1">
                  {a.from}
                  {(a.waypoints ?? []).map((w, i) => <span key={i}> → {w.name}</span>)}
                  {" → "}{a.to}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {new Date(a.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{a.aiText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
