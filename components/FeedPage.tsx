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
import { CITIES, ROUTES } from "../lib/seo-config"

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false })

type RoleFilter = "all" | "driver" | "passenger"
type TripTypeFilter = "all" | "regular" | "once"
type View = "list" | "map"

import type { Announcement } from "../types/announcement"

interface Props {
  announcements: Announcement[]
  initialHasMore?: boolean
  initialFrom: string
  initialTo: string
  loadError?: boolean
}

export default function FeedPage({ announcements, initialHasMore = false, initialFrom, initialTo, loadError }: Props) {
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
  const [showSecondField, setShowSecondField] = useState(Boolean(initialTo))

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [tripTypeFilter, setTripTypeFilter] = useState<TripTypeFilter>("all")
  const [communityFilter, setCommunityFilter] = useState("")
  const [communityFocus, setCommunityFocus] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)

  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>(announcements)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  async function loadMore() {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams({ page: String(nextPage), limit: "20" })
      if (initialFrom.trim()) params.set("from", initialFrom.trim())
      if (initialTo.trim()) params.set("to", initialTo.trim())
      const res = await fetch("/api/announcements?" + params.toString())
      const data = await res.json()
      if (data.items) {
        setAllAnnouncements(prev => [...prev, ...data.items])
        setHasMore(data.hasMore)
        setCurrentPage(nextPage)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  const { user, isLoggedIn } = useSession()

  function doSearch(from: string, to: string) {
    const params = new URLSearchParams()
    if (from.trim()) params.set("from", from.trim())
    if (to.trim())   params.set("to",   to.trim())
    startTransition(() => {
      router.push(params.toString() ? "/?" + params.toString() : "/")
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    doSearch(fromVal, toVal)
  }

  function handleReset() {
    setFromVal("")
    setToVal("")
    setShowSecondField(false)
    startTransition(() => router.push("/"))
  }

  const filtered = allAnnouncements.filter((a) => {
    if (roleFilter === "driver"    && a.role !== "driver")    return false
    if (roleFilter === "passenger" && a.role !== "passenger") return false
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
        <div className="border-b border-[#E5E7EB] px-4 pt-2 pb-2">
          <form onSubmit={handleSearch}>
            {/* Перше поле — завжди видиме */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex-1 flex items-center gap-1.5 rounded-lg border bg-[#F9FAFB] px-2 py-1.5"
                style={{ borderColor: fromVal ? "#5B8FD9" : "#E5E7EB" }}>
                <span className="text-[#9CA3AF] text-sm shrink-0">🔍</span>
                <PlaceAutocomplete
                  value={fromVal}
                  onChange={(v, place) => {
                    setFromVal(v)
                    if (place) doSearch(v, toVal)
                  }}
                  placeholder="Місто або мікрорайон"
                  dotColor="blue"
                  inputClassName="bg-transparent text-sm text-[#111827] outline-none placeholder-[#9CA3AF] w-full"
                />
                {fromVal && (
                  <button type="button" onClick={() => { setFromVal(""); doSearch("", toVal) }}
                    className="shrink-0 flex items-center justify-center rounded-full font-semibold transition-all"
                    style={{ fontSize: 12, width: 20, height: 20, background: "white", border: "2px solid #F59E0B", color: "#92400E", cursor: "pointer", lineHeight: 1 }}>×</button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSecondField(s => !s)}
                title="Уточнити напрямок"
                className="shrink-0 w-8 h-8 rounded-lg border text-sm font-bold transition-all flex items-center justify-center"
                style={showSecondField
                  ? { background: "#EBF2FC", borderColor: "#5B8FD9", color: "#3A6BBF" }
                  : { background: "white", borderColor: "#D1D5DB", color: "#9CA3AF" }}
              >{showSecondField ? "−" : "+"}</button>
            </div>

            {/* Друге поле — приховане за "+" */}
            {showSecondField && (
              <div className="flex items-center gap-1.5 rounded-lg border bg-[#F9FAFB] px-2 py-1.5 mb-1.5"
                style={{ borderColor: toVal ? "#E53935" : "#E5E7EB" }}>
                <span className="text-[#9CA3AF] text-sm shrink-0">🎯</span>
                <PlaceAutocomplete
                  value={toVal}
                  onChange={(v, place) => {
                    setToVal(v)
                    if (place) doSearch(fromVal, v)
                  }}
                  placeholder="Місто або мікрорайон"
                  dotColor="red"
                  inputClassName="bg-transparent text-sm text-[#111827] outline-none placeholder-[#9CA3AF] w-full"
                />
                {toVal && (
                  <button type="button" onClick={() => { setToVal(""); doSearch(fromVal, "") }}
                    className="shrink-0 flex items-center justify-center rounded-full font-semibold transition-all"
                    style={{ fontSize: 12, width: 20, height: 20, background: "white", border: "2px solid #F59E0B", color: "#92400E", cursor: "pointer", lineHeight: 1 }}>×</button>
                )}
              </div>
            )}
          </form>

          {/* Фільтри — 3 групи */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-0.5">

            {/* Група 1: Роль */}
            <div className="flex gap-1">
              {(["all", "driver", "passenger"] as RoleFilter[]).map(r => {
                const isActive = roleFilter === r
                const isAll = r === "all"
                const filterOn = roleFilter !== "all"
                // "Всі" з помаранчевим border коли інший фільтр активний
                const allSignal = isAll && filterOn
                return (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1"
                    style={isActive
                      ? { background: "#5B8FD9", borderColor: "#5B8FD9", color: "white" }
                      : allSignal
                      ? { background: "white", borderColor: "#F59E0B", color: "#374151", borderWidth: 2 }
                      : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}>
                    {isAll ? "Всі" : r === "driver" ? "🚗 Водій" : "💺 Пасажир"}
                    {allSignal && <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.7 }}>×</span>}
                  </button>
                )
              })}
            </div>

            <div className="w-px bg-[#E5E7EB] self-stretch" />

            {/* Група 2: Тип поїздки */}
            <div className="flex gap-1">
              {(["all", "regular", "once"] as TripTypeFilter[]).map(t => {
                const isActive = tripTypeFilter === t
                const isAll = t === "all"
                const filterOn = tripTypeFilter !== "all"
                const allSignal = isAll && filterOn
                return (
                  <button key={t} onClick={() => setTripTypeFilter(t)}
                    className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1"
                    style={isActive
                      ? { background: "#5B8FD9", borderColor: "#5B8FD9", color: "white" }
                      : allSignal
                      ? { background: "white", borderColor: "#F59E0B", color: "#374151", borderWidth: 2 }
                      : { background: "white", borderColor: "#D1D5DB", color: "#374151" }}>
                    {t === "all" ? "Всі" : t === "regular" ? "🔄 Регулярна" : "📅 Разова"}
                    {allSignal && <span style={{ fontSize: 13, lineHeight: 1, opacity: 0.7 }}>×</span>}
                  </button>
                )
              })}
            </div>

            <div className="w-px bg-[#E5E7EB] self-stretch" />

            {/* Група 3: Спільнота */}
            <div className="shrink-0 relative">
              <div className="flex items-center gap-1 rounded-full border px-2.5 py-1 transition-all"
                style={communityFilter
                  ? { background: "#5B8FD9", borderColor: "#5B8FD9" }
                  : { background: "white", borderColor: "#D1D5DB" }}>
                <span className="text-xs" style={{ color: communityFilter ? "white" : "#374151" }}>🏘</span>
                <input
                  value={communityFilter}
                  onChange={e => setCommunityFilter(e.target.value)}
                  onFocus={() => setCommunityFocus(true)}
                  onBlur={() => setTimeout(() => setCommunityFocus(false), 150)}
                  placeholder="Спільнота"
                  className="text-xs outline-none bg-transparent w-20"
                  style={{ color: communityFilter ? "white" : "#374151" }}
                />
                {communityFilter && (
                  <button onClick={() => setCommunityFilter("")}
                    className="shrink-0 flex items-center justify-center rounded-full font-semibold transition-all"
                    style={{ width: 20, height: 20, fontSize: 12, lineHeight: 1, background: "white", border: "2px solid #F59E0B", color: "#92400E", cursor: "pointer" }}>×</button>
                )}
              </div>
              {communityFocus && (() => {
                const term = communityFilter.trim().toLowerCase()
                const options = Array.from(new Set(
                  allAnnouncements.map(a => a.community).filter((c): c is string => !!c && c.toLowerCase().includes(term) && c.toLowerCase() !== term)
                )).slice(0, 6)
                return options.length > 0 ? (
                  <div style={{ position: "absolute", top: "110%", left: 0, zIndex: 9999, background: "white", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", minWidth: 140, overflow: "hidden" }}>
                    {options.map(c => (
                      <button key={c} onMouseDown={() => setCommunityFilter(c)}
                        className="block w-full text-left px-3 py-1.5 text-xs hover:bg-[#EBF2FC] transition-colors"
                        style={{ color: "#374151" }}>🏘 {c}</button>
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

          {loadError ? (
            <div className="bg-white rounded-2xl border border-[#FCA5A5] p-10 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-sm text-[#6B7280] font-medium">Не вдалось завантажити оголошення</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Спробуй оновити сторінку</p>
              <button onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#5B8FD9" }}>
                Оновити
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-[#6B7280] font-medium">Нічого не знайдено</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Спробуй інший маршрут або зміни фільтри</p>
            </div>
          ) : (
            <>
              {filtered.map((a) => (
                <AnnouncementCard key={a._id} announcement={a} isLoggedIn={isLoggedIn} currentUserId={user?.id} />
              ))}
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="w-full py-3 rounded-2xl text-sm font-semibold border transition-all"
                  style={isLoadingMore
                    ? { background: "#F3F4F6", borderColor: "#E5E7EB", color: "#9CA3AF", cursor: "not-allowed" }
                    : { background: "white", borderColor: "#5B8FD9", color: "#3A6BBF", cursor: "pointer" }}
                     >
                  {isLoadingMore ? "Завантажую..." : "Показати ще 20"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Карта — монтується тільки після першого відкриття, потім залишається */}
      {mapEverOpened && (
        <div style={{ display: view === "map" ? "block" : "none", position: "relative", zIndex: 1 }} className="pb-24">
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
        <footer className="bg-white border-t border-[#E5E7EB] px-4 py-5 text-xs text-[#9CA3AF]" style={{ marginBottom: 80 }}>

          {/* Про сервіс */}
          <div className="mb-4 pb-4 border-b border-[#F3F4F6]">
            <p className="font-semibold text-[#6B7280] mb-1">ПопуткиUA — приміські щоденні поїздки</p>
            <p className="leading-relaxed mb-2">Безкоштовний сервіс для тих, хто щодня їде між передмістям і Києвом. Знайди водія або пасажира на своєму маршруті — домовляйтесь напряму в Telegram.</p>
            <a href="https://t.me/poputky_ua" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#229ED9] hover:underline font-medium">
              ✈️ Telegram-канал @poputky_ua — нові оголошення одразу у вашому Telegram
            </a>
          </div>

          {/* Міста */}
          <div className="mb-4 pb-4 border-b border-[#F3F4F6]">
            <p className="font-semibold text-[#6B7280] mb-2">Міста поруч з Києвом</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {CITIES.map(c => (
                <Link key={c.slug} href={`/city/${c.slug}`}
                  className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Маршрути */}
          <div className="mb-4 pb-4 border-b border-[#F3F4F6]">
            <p className="font-semibold text-[#6B7280] mb-2">Маршрути → Київ</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {ROUTES.filter(r => r.to === "Київ").map(r => (
                <Link key={r.slug} href={`/route/${r.slug}`}
                  className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline">
                  {r.from}
                </Link>
              ))}
            </div>
          </div>

          {/* Копірайт і посилання */}
          <div className="flex gap-4 justify-center flex-wrap text-center">
            <Link href="/about" className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline">Про сервіс</Link>
            <Link href="/rules" className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors no-underline">Правила</Link>
            <a href="https://t.me/poputky_ua" target="_blank" rel="noopener noreferrer"
              className="text-[#6B7280] hover:text-[#5B8FD9] transition-colors">Telegram-канал</a>
            <span>Попутки UA © 2026</span>
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
