"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "../../lib/useSession"

const ADMIN_EMAIL = "artemdenisenko129@gmail.com"

interface Stats {
  total: number; active: number; archived: number
  today: number; thisWeek: number; thisMonth: number
  totalUsers: number; consentCount: number
}

interface Ann {
  _id: string; role: string; from: string; to: string
  createdAt?: string; isActive: boolean; authorName?: string
  telegramUsername?: string; archiveReason?: string; tripType?: string
  views?: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useSession()
  const [tab, setTab] = useState<"stats"|"announcements"|"users">("stats")
  const [filter, setFilter] = useState("active")
  const [sortBy, setSortBy] = useState<"date_desc"|"date_asc"|"views">("date_desc")
  const [stats, setStats] = useState<Stats | null>(null)
  const [items, setItems] = useState<Ann[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [dataLoading, setDataLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user || user.email !== ADMIN_EMAIL) router.replace("/")
  }, [user, loading])

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return
    loadData()
    setSelected(new Set())
  }, [tab, filter, sortBy, page, user])

  async function loadData() {
    setDataLoading(true)
    const url = `/api/admin?tab=${tab}&filter=${filter}&sort=${sortBy}&page=${page}`
    const res = await fetch(url)
    const d = await res.json()
    if (tab === "stats") setStats(d)
    else { setItems(d.items || []); setCount(d.count || 0); setPages(d.pages || 1) }
    setDataLoading(false)
  }

  async function handleAction(id: string, action: string) {
    await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    })
    loadData()
  }

  async function handleBulkDeactivate() {
    if (selected.size === 0) return
    if (!confirm(`Деактивувати ${selected.size} оголошень?`)) return
    setBulkLoading(true)
    await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action: "bulk_deactivate" }),
    })
    setBulkLoading(false)
    setSelected(new Set())
    loadData()
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(a => a._id)))
  }

  if (loading || !user) return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#5B8FD9] border-t-transparent animate-spin" />
    </div>
  )
  if (user.email !== ADMIN_EMAIL) return null

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-base font-extrabold text-[#111827]">Попутки<span style={{ color: "#5B8FD9" }}>UA</span></span>
          <span className="ml-2 text-xs font-semibold text-[#E53935] bg-[#FDECEA] px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <Link href="/" className="text-sm text-[#6B7280] no-underline hover:text-[#5B8FD9]">← На сайт</Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex border-b border-[#E5E7EB] mb-6">
          {([
            { key: "stats", label: "📊 Статистика" },
            { key: "announcements", label: "📋 Оголошення" },
            { key: "users", label: "👥 Користувачі" },
          ] as const).map(({ key, label }) => (
            <button key={key} onClick={() => { setTab(key); setPage(1) }}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-all"
              style={tab === key
                ? { color: "#5B8FD9", borderColor: "#5B8FD9", fontWeight: 700 }
                : { color: "#9CA3AF", borderColor: "transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Статистика */}
        {tab === "stats" && stats && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Всього оголошень", value: stats.total, color: "#374151" },
                { label: "Активних", value: stats.active, color: "#059669" },
                { label: "В архіві", value: stats.archived, color: "#9CA3AF" },
                { label: "Користувачів", value: stats.totalUsers, color: "#3A6BBF" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center">
                  <div className="text-3xl font-extrabold mb-1" style={{ color }}>{value}</div>
                  <div className="text-xs text-[#6B7280]">{label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Нові оголошення</p>
              <div className="flex gap-6">
                <div><span className="text-2xl font-bold text-[#111827]">{stats.today}</span><span className="text-xs text-[#9CA3AF] ml-1">за добу</span></div>
                <div><span className="text-2xl font-bold text-[#111827]">{stats.thisWeek}</span><span className="text-xs text-[#9CA3AF] ml-1">за тиждень</span></div>
                <div><span className="text-2xl font-bold text-[#111827]">{stats.thisMonth}</span><span className="text-xs text-[#9CA3AF] ml-1">за місяць</span></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-2">Правила і згоди</p>
              <p className="text-sm text-[#374151]">Підтверджень: <span className="font-bold">{stats.consentCount}</span></p>
            </div>
          </div>
        )}

        {/* Оголошення */}
        {tab === "announcements" && (
          <div>
            {/* Фільтри і сортування */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <div className="flex gap-1">
                {[
                  { val: "active", label: "Активні" },
                  { val: "archived", label: "Архів" },
                  { val: "all", label: "Всі" },
                ].map(({ val, label }) => (
                  <button key={val} onClick={() => { setFilter(val); setPage(1); setSelected(new Set()) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={filter === val
                      ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                      : { background: "white", borderColor: "#E5E7EB", color: "#374151" }}>
                    {label}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as any); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-xs border border-[#E5E7EB] bg-white text-[#374151] outline-none">
                <option value="date_desc">Спочатку нові</option>
                <option value="date_asc">Спочатку старі</option>
                <option value="views">За переглядами</option>
              </select>

              <span className="text-xs text-[#9CA3AF] ml-auto">{count} оголошень</span>
            </div>

            {/* Bulk панель */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl px-4 py-2.5 mb-3">
                <span className="text-sm font-semibold text-[#92400E]">Вибрано: {selected.size}</span>
                <button onClick={handleBulkDeactivate} disabled={bulkLoading}
                  className="ml-auto px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#E53935] disabled:opacity-60 transition-all">
                  {bulkLoading ? "..." : "Деактивувати вибрані"}
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-[#92400E] underline">Скасувати</button>
              </div>
            )}

            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-[#5B8FD9] border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Вибрати всі */}
                {items.length > 0 && (
                  <div className="flex items-center gap-3 px-2 py-1">
                    <input type="checkbox"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 accent-[#5B8FD9]" />
                    <span className="text-xs text-[#9CA3AF]">Вибрати всі на сторінці</span>
                  </div>
                )}
                {items.map((a: Ann) => (
                  <div key={a._id}
                    className="bg-white rounded-xl border px-4 py-3 flex items-center gap-3 transition-all"
                    style={{ borderColor: selected.has(a._id) ? "#5B8FD9" : "#E5E7EB" }}>
                    <input type="checkbox"
                      checked={selected.has(a._id)}
                      onChange={() => toggleSelect(a._id)}
                      className="w-4 h-4 accent-[#5B8FD9] shrink-0" />
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={a.role === "driver"
                        ? { background: "#EBF2FC", color: "#3A6BBF" }
                        : { background: "#FDECEA", color: "#E53935" }}>
                      {a.role === "driver" ? "В" : "П"}
                    </span>
                    {a.tripType === "regular" && (
                      <span className="text-[10px] bg-[#F0FDF4] text-[#059669] px-1.5 py-0.5 rounded-full shrink-0">🔄</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{a.from} → {a.to}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {a.authorName || a.telegramUsername || "—"}
                        {a.createdAt ? " · " + new Date(a.createdAt).toLocaleDateString("uk-UA", { day:"numeric", month:"short", year:"numeric" }) : ""}
                        {(a.views ?? 0) > 0 ? ` · 👁 ${a.views}` : ""}
                        {a.archiveReason ? ` · ${a.archiveReason}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a href={`/announcement/${a._id}`} target="_blank"
                        className="text-xs px-2 py-1 rounded-lg border border-[#E5E7EB] text-[#6B7280] no-underline hover:border-[#5B8FD9]">↗</a>
                      {a.isActive ? (
                        <button onClick={() => handleAction(a._id, "deactivate")}
                          className="text-xs px-2 py-1 rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:border-[#E53935] hover:text-[#E53935] transition-all">
                          Деактив.
                        </button>
                      ) : (
                        <button onClick={() => handleAction(a._id, "restore")}
                          className="text-xs px-2 py-1 rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:border-[#059669] hover:text-[#059669] transition-all">
                          Відновити
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="flex gap-2 justify-center mt-4">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] disabled:opacity-40">← Назад</button>
                <span className="text-xs self-center text-[#6B7280]">{page} / {pages}</span>
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] disabled:opacity-40">Далі →</button>
              </div>
            )}
          </div>
        )}

        {/* Користувачі */}
        {tab === "users" && (
          <div>
            <p className="text-xs text-[#9CA3AF] mb-3">{count} профілів у базі</p>
            {dataLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-[#5B8FD9] border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((u: any) => (
                  <div key={u.userId} className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#EBF2FC] flex items-center justify-center text-sm font-bold text-[#3A6BBF] shrink-0">
                      {u.userId?.slice(0,1)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#374151] truncate">{u.userId}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {u.community ? `🏘 ${u.community} · ` : ""}
                        {u.consentAt ? "Згода: " + new Date(u.consentAt).toLocaleDateString("uk-UA") : "Без згоди"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
