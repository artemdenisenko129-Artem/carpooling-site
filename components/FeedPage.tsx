"use client"
import { useState, useTransition, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSession, logout } from "../lib/useSession"
import AnnouncementCard from "./AnnouncementCard"
import PlaceAutocomplete from "./PlaceAutocomplete"
import MapErrorBoundary from "./MapErrorBoundary"
import LogoSVG from "./LogoSVG"

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false })

type RoleFilter = "all" | "driver" | "passenger"
type ScopeFilter = "all" | "suburban" | "intercity"
type TripTypeFilter = "all" | "regular" | "once"
type View = "list" | "map"

import type { Announcement } from "../types/announcement"

interface Props {
  announcements: Announcement[]
  initialFrom: string
  initialTo: string
}

export default function FeedPage({ announcements, initialFrom, initialTo }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useState<View>("list")
  const [mapEverOpened, setMapEverOpened] = useState(false)
  const [highlightId, setHighlightId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const v = searchParams.get("view")
    const id = searchParams.get("id") ?? undefined
    if (v === "map") {
      setView("map")
      setMapEverOpened(true)
      setHighlightId(id)
    }
  }, [])

  const [fromVal, setFromVal] = useState(initialFrom)
  const [toVal, setToVal]   = useState(initialTo)

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all")
  const [tripTypeFilter, setTripTypeFilter] = useState<TripTypeFilter>("all")
  const [communityFilter, setCommunityFilter] = useState("")
  const [communityFocus, setCommunityFocus] = useState(false)

  const { user, isLoggedIn } = useSession()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (fromVal.trim()) params.set("from", fromVal.trim())
    if (toVal.trim())   params.set("to",   toVal.trim())
    startTransition(() => {
      router.push(params.toString() ? "/?" + params.toString() : "/")
    })
  }

  function handleReset() {
    setFromVal("")
    setToVal("")
    startTransition(() => router.push("/"))
  }

  const filtered = announcements.filter((a) => {
    if (roleFilter === "driver"    && a.role !== "driver")    return false
    if (roleFilter === "passenger" && a.role !== "passenger") return false
    if (scopeFilter === "suburban"  && a.tripScope === "intercity") return false
    if (scopeFilter === "intercity" && a.tripScope !== "intercity") return false
    if (tripTypeFilter === "regular" && a.tripType !== "regular") return false
    if (tripTypeFilter === "once" && a.tripType !== "once") return false
    if (communityFilter && !a.community?.toLowerCase().includes(communityFilter.trim().toLowerCase())) return false
    return true
  })

  const isSearchActive = Boolean(initialFrom || initialTo)

  return (
    <div className="min-h-screen bg-[#F3F4F6]">

      {/* Закріплений верхній блок */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">

        {/* Хедер */}
        <header className="border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            <LogoSVG />
            <div className="leading-tight">
              <div className="text-lg font-extrabold text-[#111827] tracking-tight">
                Попутки<span style={{ color: "#5B8FD9" }}>UA</span>
              </div>
              <div className="text-[10px] text-[#9CA3AF] font-normal">приміські поїздки</div>
            </div>
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/profile"
                className="rounded-full px-3 py-1.5 text-xs font-semibold no-underline border transition-colors"
                style={{ background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }}
              >
                👤 Кабінет
              </Link>
              <button
                className="border border-[#E5E7EB] rounded-full px-3 py-1.5 text-xs font-medium text-[#6B7280] bg-[#F9FAFB] transition-colors hover:border-[#E53935] hover:text-[#E53935]"
                onClick={logout}
              >
                Вийти
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors no-underline"
              style={{ background: "#5B8FD9" }}
            >
              Увійти
            </Link>
          )}
        </header>

        {/* Пошук */}
        <div className="border-b border-[#E5E7EB] px-4 pt-2 pb-0">
          <form onSubmit={handleSearch}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 flex items-center gap-1.5 rounded-lg border bg-[#F9FAFB] px-2 py-1.5"
                style={{ borderColor: "#E5E7EB" }}>
                <span className="text-[#9CA3AF] text-sm shrink-0">🔍</span>
                <PlaceAutocomplete
                  value={fromVal}
                  onChange={(v) => setFromVal(v)}
                  placeholder="Населений пункт"
                  dotColor="blue"
                  inputClassName="bg-transparent text-sm text-[#111827] outline-none placeholder-[#9CA3AF] w-full"
                />
                {fromVal && <button type="button" onClick={() => setFromVal("")} className="text-[#9CA3AF] text-xs shrink-0">✕</button>}
              </div>
              <div className="flex-1 flex items-center gap-1.5 rounded-lg border bg-[#F9FAFB] px-2 py-1.5"
                style={{ borderColor: "#E5E7EB" }}>
                <span className="text-[#9CA3AF] text-sm shrink-0">🔍</span>
                <PlaceAutocomplete
                  value={toVal}
                  onChange={(v) => setToVal(v)}
                  placeholder="Населений пункт"
                  dotColor="red"
                  inputClassName="bg-transparent text-sm text-[#111827] outline-none placeholder-[#9CA3AF] w-full"
                />
                {toVal && <button type="button" onClick={() => setToVal("")} className="text-[#9CA3AF] text-xs shrink-0">✕</button>}
              </div>
              <button
                type="submit"
                className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-colors"
                style={{ background: isPending ? "#93B8E8" : "#5B8FD9" }}
                aria-label="Знайти"
              >→</button>
            </div>
            {isSearchActive && (
              <button type="button" onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 px-3 py-1.5 rounded-lg border transition-all"
                style={{ color: "#E53935", borderColor: "#FECACA", background: "#FEF2F2" }}>
                ✕ Скинути пошук
              </button>
            )}
          </form>

          <div className="flex gap-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {(["all", "driver", "passenger"] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={roleFilter === r
                  ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF", fontWeight: 600 }
                  : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}
              >
                {r === "all" ? "🚘 Всі" : r === "driver" ? "🚗 Водій" : "💺 Пасажир"}
              </button>
            ))}

            {(["suburban", "intercity"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScopeFilter(scopeFilter === s ? "all" : s)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={scopeFilter === s
                  ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF", fontWeight: 600 }
                  : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}
              >
                {s === "suburban" ? "🏘 Приміська" : "🛣 Міжміська"}
              </button>
            ))}

            {(["regular", "once"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTripTypeFilter(tripTypeFilter === t ? "all" : t)}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={tripTypeFilter === t
                  ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF", fontWeight: 600 }
                  : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}
              >
                {t === "regular" ? "🔄 Регулярно" : "📅 Одного разу"}
              </button>
            ))}

            <div className="shrink-0 relative">
              <div className="flex items-center gap-1 rounded-full border px-2 py-1 transition-all"
                style={communityFilter
                  ? { background: "#EBF2FC", borderColor: "#5B8FD9" }
                  : { background: "white", borderColor: "#D1D5DB" }}>
                <span className="text-xs">🏘</span>
                <input
                  value={communityFilter}
                  onChange={e => setCommunityFilter(e.target.value)}
                  onFocus={() => setCommunityFocus(true)}
                  onBlur={() => setTimeout(() => setCommunityFocus(false), 150)}
                  placeholder="Спільнота"
                  className="text-xs outline-none bg-transparent w-20"
                  style={{ color: communityFilter ? "#3A6BBF" : "#374151" }}
                />
                {communityFilter && (
                  <button onClick={() => setCommunityFilter("")} className="text-[#9CA3AF] text-xs ml-0.5">✕</button>
                )}
              </div>
              {communityFocus && (() => {
                const term = communityFilter.trim().toLowerCase()
                const options = Array.from(new Set(
                  announcements.map(a => a.community).filter((c): c is string => !!c && c.toLowerCase().includes(term) && c.toLowerCase() !== term)
                )).slice(0, 6)
                return options.length > 0 ? (
                  <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 200, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 140, overflow: "hidden" }}>
                    {options.map(c => (
                      <button key={c} onMouseDown={() => setCommunityFilter(c)}
                        className="block w-full text-left px-3 py-1.5 text-xs hover:bg-[#EBF2FC] transition-colors"
                        style={{ color: "#374151" }}>
                        🏘 {c}
                      </button>
                    ))}
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </div>

        {/* Перемикач список/карта */}
        <div className="border-b border-[#E5E7EB] flex">
          <button
            onClick={() => setView("list")}
            className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all"
            style={view === "list"
              ? { color: "#5B8FD9", borderColor: "#5B8FD9", fontWeight: 700 }
              : { color: "#9CA3AF", borderColor: "transparent" }}
          >
            ☰ Список
          </button>
          <button
            onClick={() => { setView("map"); setMapEverOpened(true); setTimeout(() => { (window as any)._leafletMap?.invalidateSize() }, 100) }}
            className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 border-b-2 transition-all"
            style={view === "map"
              ? { color: "#5B8FD9", borderColor: "#5B8FD9", fontWeight: 700 }
              : { color: "#9CA3AF", borderColor: "transparent" }}
          >
            🗺 Карта
          </button>
        </div>

      </div>{/* кінець sticky блоку */}

      {/* Список */}
      {view === "list" && (
        <div className="px-4 pt-3 pb-32 flex flex-col gap-3">
          <p className="text-xs text-[#9CA3AF]">
            {isSearchActive ? "Результати пошуку:" : "Останні оголошення:"}{" "}
            <span className="font-semibold text-[#6B7280]">{filtered.length}</span>
          </p>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-[#6B7280] font-medium">Нічого не знайдено</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Спробуй інший маршрут або зміни фільтри</p>
            </div>
          ) : (
            filtered.map((a) => (
              <AnnouncementCard key={a._id} announcement={a} isLoggedIn={isLoggedIn} currentUserId={user?.id} />
            ))
          )}
        </div>
      )}

      {/* Карта — монтується тільки після першого відкриття, потім залишається */}
      {mapEverOpened && (
        <div style={{ display: view === "map" ? "block" : "none" }} className="pb-24">
          <MapErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center" style={{ height: 440 }}>
                <div className="w-8 h-8 rounded-full border-2 border-[#5B8FD9] border-t-transparent animate-spin" />
              </div>
            }>
              <LeafletMap announcements={filtered} highlightId={highlightId} />
            </Suspense>
          </MapErrorBoundary>
        </div>
      )}

      {/* Футер — тільки в режимі списку */}
      {view === "list" && (
        <footer className="bg-white border-t border-[#E5E7EB] px-4 py-5 text-center text-xs text-[#9CA3AF]" style={{ marginBottom: 80 }}>
          <p className="mb-2">Попутки UA © 2026</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#" className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Правила сайту</a>
            <a href="#" className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Про сервіс</a>
            <a href="https://t.me/poputtky_ua" target="_blank" rel="noopener noreferrer"
              className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Telegram-канал</a>
          </div>
        </footer>
      )}

      {/* Кнопка створити оголошення */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-5 pt-3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(243,244,246,1) 60%, rgba(243,244,246,0))" }}>
        <Link
          href="/new"
          className="pointer-events-auto block text-center rounded-2xl text-base font-bold text-white no-underline transition-colors py-4"
          style={{ background: "#5B8FD9", boxShadow: "0 4px 20px rgba(91,143,217,0.4)" }}
        >
          + Створити оголошення
        </Link>
      </div>

    </div>
  )
}
